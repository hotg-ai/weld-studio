use uuid::Uuid;

use crate::errors::SerializableError;

#[tracing::instrument]
#[tauri::command(skip(sql))]
pub async fn create_dataset(name: &str, sql: &str) -> Result<DatasetInfo, SerializableError> {
    todo!();
}

#[derive(Debug, Clone, PartialEq, ts_rs::TS)]
pub struct DatasetInfo {
    pub id: String,
    pub name: String,
    pub num_rows: usize,
}
