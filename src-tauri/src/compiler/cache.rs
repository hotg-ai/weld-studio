use std::{
    collections::HashMap,
    fmt::Display,
    path::PathBuf,
    sync::{Arc, RwLock},
};

use anyhow::Context;
use hotg_rune_compiler::{im::Vector, ReadError, Text};
use reqwest::{blocking::Client, StatusCode};
use serde::Deserialize;
use uriparse::{Scheme, URI};

#[derive(Debug)]
pub struct Cache {
    cache: RwLock<HashMap<String, Bucket>>,
    client: Client,
    strategy: CachingStrategy,
}

impl Cache {
    pub fn with_strategy(strategy: CachingStrategy) -> Self {
        Cache {
            cache: RwLock::default(),
            client: Client::new(),
            strategy,
        }
    }

    #[tracing::instrument]
    fn wapm_file(&self, uri: &URI<'_>) -> Result<Vector<u8>, ReadError> {
        let (namespace, package_name) = match uri.path().segments() {
            [ns, pkg] => (ns.as_str(), pkg.as_str()),
            _ => {
                return Err(ReadError::other(MalformedPackagePath {
                    path: uri.path().clone().into_owned(),
                }))
            }
        };

        // https://registry-cdn.wapm.io/contents/hotg-ai/softmax/0.12.0/softmax.wasm
        let query = uri.query().map(|q| q.as_str()).unwrap_or_default();
        let query = queryst::parse(query).map_err(|e| ReadError::msg(e.message))?;
        let query_params: QueryParams =
            QueryParams::deserialize(&query).map_err(ReadError::other)?;
        let version = query_params
            .version
            .ok_or_else(|| ReadError::msg("No version specified"))?;

        let wapm_url = format!("https://registry-cdn.wapm.io/contents/{namespace}/{package_name}/{version}/{package_name}.wasm");

        self.http_file(&wapm_url)
            .map_err(<Box<dyn std::error::Error + Send + Sync>>::from)
            .map_err(|e| ReadError::Other(Arc::from(e)))
    }

    fn http_file(&self, url: &str) -> Result<Vector<u8>, anyhow::Error> {
        if let Some(cached) = self.get_cached(url) {
            tracing::info!("Cache hit!");
            return Ok(cached);
        }

        tracing::info!("Downloading");
        let response = self.client.get(url).send()?.error_for_status()?;

        let etag = response
            .headers()
            .get(reqwest::header::ETAG)
            .and_then(|v| v.to_str().ok())
            .map(Text::from);
        let status_code = response.status();

        let body = response.bytes().context("Read failed")?;
        let body = Vector::from(&*body);

        tracing::info!(
            status_code = status_code.as_u16(),
            status = %status_code,
            bytes_read = body.len(),
            "Downloaded",
        );

        if let Some(etag) = etag {
            tracing::info!(%etag, "Updating the cache");
            let bucket = Bucket {
                data: body.clone(),
                etag,
            };
            self.cache.write().unwrap().insert(url.to_string(), bucket);
        }

        Ok(body)
    }

    fn read_file(&self, path: &uriparse::Path<'_>) -> Result<Vector<u8>, ReadError> {
        let mut full_path = PathBuf::new();

        if path.is_absolute() {
            full_path.push(std::path::Component::RootDir.as_os_str());
        }

        for segment in path.segments() {
            full_path.push(segment.as_str());
        }

        std::fs::read(&full_path)
            .map(Vector::from)
            .map_err(|e| ReadError::Other(Arc::new(e) as Arc<_>))
    }

    #[tracing::instrument(level = "debug", skip_all)]
    fn get_cached(&self, url: &str) -> Option<Vector<u8>> {
        let bucket = self.cache.read().ok()?.get(url)?.clone();

        match self.strategy {
            CachingStrategy::Etags => check_etag(bucket, &self.client, url),
            CachingStrategy::Url => Some(bucket.data),
            CachingStrategy::Never => None,
        }
    }
}

fn check_etag(bucket: Bucket, client: &Client, url: &str) -> Option<Vector<u8>> {
    let Bucket { data, etag } = bucket;
    tracing::info!(%etag, "Checking if the cached value is still valid");

    let response = client
        .head(url)
        .header(reqwest::header::IF_NONE_MATCH, etag.as_str())
        .send()
        .ok()?;

    let status = response.status();
    let headers = response.headers();
    let remote = response.remote_addr();
    tracing::debug!(%status, ?headers, ?remote, "Recieved response");

    if status == StatusCode::NOT_MODIFIED {
        Some(data)
    } else {
        None
    }
}

impl hotg_rune_compiler::FileSystem for Cache {
    #[tracing::instrument(level = "debug", skip(self, path), fields(path = %path), err)]
    fn read(&self, path: &URI<'_>) -> Result<Vector<u8>, ReadError> {
        match path.scheme() {
            Scheme::HTTP | Scheme::HTTPS => {
                let url = path.to_string();
                self.http_file(&url)
                    .map_err(|e| Box::<dyn std::error::Error + Send + Sync>::from(e))
                    .map_err(|e| ReadError::Other(e.into()))
            }
            Scheme::Unregistered(u) if u.as_str().is_empty() => self.read_file(path.path()),
            Scheme::File => self.read_file(path.path()),
            Scheme::Unregistered(u) if u.as_str() == "wapm" => self.wapm_file(path),
            other => Err(ReadError::UnsupportedScheme {
                scheme: other.to_string().into(),
            }),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
struct Bucket {
    data: Vector<u8>,
    etag: Text,
}

#[derive(Debug, Copy, Clone, PartialEq, strum::EnumString, strum::EnumVariantNames)]
#[strum(serialize_all = "kebab-case")]
pub enum CachingStrategy {
    /// Use the `ETAGS` header to figure out whether a cached value is fresh.
    Etags,
    /// A cached value is always fresh if we've received a successful response
    /// before.
    Url,
    /// Cached values are always stale.
    Never,
}

#[derive(Debug)]
struct MalformedPackagePath {
    path: uriparse::Path<'static>,
}

impl Display for MalformedPackagePath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Unable to determine the package name and namespace from \"{}\". Expected something like <namespace>/<name>", self.path)
    }
}

impl std::error::Error for MalformedPackagePath {}

#[derive(Debug, serde::Deserialize)]
struct QueryParams {
    version: Option<String>,
}
