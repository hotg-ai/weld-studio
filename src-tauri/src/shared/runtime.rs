use std::collections::HashMap;

use ts_rs::TS;

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Analysis {
    run_time_ms: u32,
}

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Pipeline(pub HashMap<String, Node>);

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Node {
    #[serde(rename = "type")]
    pub ty: NodeKind,
    pub identifier: String,
    pub args: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
#[serde(rename_all = "snake_case")]
pub enum NodeKind {
    Model,
    ProcBlock,
}

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct ColumnMapping {
    pub tensor_id: String,
    pub node_name: String,
    pub input_tensor_name: String,
}
