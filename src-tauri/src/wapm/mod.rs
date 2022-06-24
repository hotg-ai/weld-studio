use std::fmt::Display;

use graphql_client::GraphQLQuery;

use crate::shared::Package;

#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "src/wapm/schema.graphql",
    query_path = "src/wapm/get_packages_by_namespace.graphql",
    response_derives = "Debug,Serialize"
)]
pub struct GetNamespace;

const WELD_REGISTRY: &str = include_str!("../local_manifest.json");
#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn known_proc_blocks() -> Result<Vec<Package>, String> {
    let packages: Vec<Package> = serde_json::from_str(WELD_REGISTRY).map_err(|e| e.to_string())?;

    // let query = GetNamespace::build_query(get_namespace::Variables {
    //     name: "hotg-ai".to_string(),
    // });

    // tracing::info!("Fetching known proc-bloacks");

    // let Response { data, errors }: Response<get_namespace::ResponseData> = client
    //     .post(WAPM_REGISTRY)
    //     .json(&query)
    //     .send()
    //     .await
    //     // .and_then(|response| response.error_for_status())
    //     .context("Unable to query the WAPM registry")?
    //     .json()
    //     .await
    //     .context("Unable to deserialize the response")?;

    // if let Some(errors) = errors {
    //     let error_messages: Vec<_> = errors.iter().map(|e| e.to_string()).collect();
    //     tracing::error!(
    //         ?errors,
    //         ?error_messages,
    //         "One or more errors occurred while querying WAPM's GraphQL API",
    //     );
    //     return Err(Error::msg("Querying the WAPM registry failed").into());
    // }

    // let packages = flatten_packages(data);

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

// fn flatten_packages(data: Option<get_namespace::ResponseData>) -> Vec<Package> {
//     let edges = data
//         .and_then(|d| d.get_namespace)
//         .and_then(|ns| ns.packages)
//         .map(|pkgs| pkgs.edges)
//         .unwrap_or_default();
//     let nodes = edges.into_iter().flatten().filter_map(|edge| edge.node);

//     let mut packages = Vec::new();

//     for node in nodes {
//         if let Some(mut last_version) = node.last_version {
//             if last_version.modules.is_empty() {
//                 continue;
//             }

//             let main_module = last_version.modules.remove(0);
//             let pkg = Package {
//                 name: node.name,
//                 description: last_version.description,
//                 last_version: last_version.version,
//                 public_url: main_module.public_url,
//             };
//             packages.push(pkg);
//         }
//     }

//     packages
// }
