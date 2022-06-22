#[derive(Debug, serde::Serialize, serde::Deserialize, ts_rs::TS)]
#[serde(rename_all = "camelCase")]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Package {
    pub name: String,
    pub description: String,
    pub last_version: String,
    pub public_url: String,
}
