use anyhow::{Context, Error};
use arrow::{json, record_batch::RecordBatch};
use duckdb::params;
use graphql_client::{GraphQLQuery, Response};
use std::fmt::Display;

use crate::AppState;

use crate::shared::Package;

#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "src/wapm/schema.graphql",
    query_path = "src/wapm/get_packages_by_namespace.graphql",
    response_derives = "Debug,Serialize"
)]
pub struct GetNamespace;

const WAPM_REGISTRY: &str = "https://registry.wapm.io/graphql";

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn known_proc_blocks(
    app_state: tauri::State<'_, AppState>,
) -> Result<Vec<Package>, SerializableError> {
    let conn = app_state.meta_db().await;

    let mut table = conn
        .prepare("select * from proc_blocks")
        .map_err(|e| anyhow::Error::msg(e.to_string()))?;

    let batches: Vec<RecordBatch> = table
        .query_arrow(params![])
        .map_err(|e| anyhow::Error::msg(e.to_string()))?
        .collect();

    let packages: Vec<serde_json::Map<std::string::String, serde_json::Value>> =
        json::writer::record_batches_to_json_rows(&batches[..])
            .map_err(|e| anyhow::Error::msg(e.to_string()))?;

    let packages: Vec<Package> = packages
        .iter()
        .map(|record: &serde_json::Map<String, serde_json::Value>| {
            let name = record.get("name").unwrap().as_str().unwrap().to_string();

            let description = record
                .get("description")
                .unwrap()
                .as_str()
                .unwrap()
                .to_string();
            let version = record.get("version").unwrap().as_str().unwrap().to_string();
            let public_url = record.get("fileLoc").unwrap().as_str().unwrap().to_string();
            return Package {
                name: name,
                description: description,
                last_version: version,
                public_url: public_url,
            };
        })
        .collect();

    tracing::debug!(
        packages = ?packages.len(),
        "Received list of hotg-ai packages",
    );

    Ok(packages)
}

#[tracing::instrument(skip_all, err)]
pub async fn fetch_packages(
    client: tauri::State<'_, reqwest::Client>,
) -> Result<Vec<Package>, SerializableError> {
    let query = GetNamespace::build_query(get_namespace::Variables {
        name: "hotg-ai".to_string(),
    });

    //
    tracing::info!("Fetching known proc-blocks");

    let Response { data, errors }: Response<get_namespace::ResponseData> = client
        .post(WAPM_REGISTRY)
        .json(&query)
        .send()
        .await
        // .and_then(|response| response.error_for_status())
        .context("Unable to query the WAPM registry")?
        .json()
        .await
        .context("Unable to deserialize the response")?;

    if let Some(errors) = errors {
        let error_messages: Vec<_> = errors.iter().map(|e| e.to_string()).collect();
        tracing::error!(
            ?errors,
            ?error_messages,
            "One or more errors occurred while querying WAPM's GraphQL API",
        );
        return Err(Error::msg("Querying the WAPM registry failed").into());
    }

    let packages = flatten_packages(data);

    // for package in packages.iter() {
    //     tracing::info!("Caching to {}", format!("/tmp/{}.wasm", package.name));
    //     fetch_url(&package.public_url, format!("/tmp/{}.wasm", package.name))
    //         .await
    //         .map_err(|e|
    //             SerializableError::from(
    //                 anyhow::anyhow!("Cannot cache {}", e.to_string())
    //             )
    //         )?;
    // }

    tracing::debug!(
        packages = ?packages,
        "Received list of hotg-ai packages",
    );

    Ok(packages)
}

#[derive(Debug, serde::Serialize)]
pub struct SerializableError {
    msg: String,
    causes: Vec<String>,
    backtrace: String,
}

impl From<anyhow::Error> for SerializableError {
    fn from(e: anyhow::Error) -> Self {
        let causes = e.chain().map(|cause| cause.to_string()).collect();

        SerializableError {
            msg: e.to_string(),
            causes,
            backtrace: format!("{:?}", e),
        }
    }
}

impl Display for SerializableError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        Display::fmt(&self.msg, f)
    }
}

impl std::error::Error for SerializableError {}

fn flatten_packages(data: Option<get_namespace::ResponseData>) -> Vec<Package> {
    let edges = data
        .and_then(|d| d.get_namespace)
        .and_then(|ns| ns.packages)
        .map(|pkgs| pkgs.edges)
        .unwrap_or_default();
    let nodes = edges.into_iter().flatten().filter_map(|edge| edge.node);

    let mut packages = Vec::new();

    for node in nodes {
        if let Some(mut last_version) = node.last_version {
            if last_version.modules.is_empty() {
                continue;
            }

            let main_module = last_version.modules.remove(0);
            let pkg = Package {
                name: node.name,
                description: last_version.description,
                last_version: last_version.version,
                public_url: main_module.public_url,
            };
            packages.push(pkg);
        }
    }

    packages
}

// use std::io::Cursor;
// async fn fetch_url(
//     url: &String,
//     file_name: String,
// ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
//     let response = reqwest::get(url).await?;
//     tracing::info!(p=?url);
//     let mut file = std::fs::File::create(file_name)?;
//     let mut content = Cursor::new(response.bytes().await?);
//     std::io::copy(&mut content, &mut file)?;
//     Ok(())
// }
