use std::sync::Arc;

use crate::shared::{PaginationConfig, Schema, SerializableError};
use arrow::array::{Array, BooleanArray, Int32Array, StringArray, StructArray};
use ts_rs::TS;
use uuid::Uuid;

#[tracing::instrument(skip(_sql), err)]
#[tauri::command]
pub async fn create_dataset(name: &str, _sql: &str) -> Result<DatasetInfo, SerializableError> {
    let age: Int32Array = vec![10, 52, 42, 17].into();
    let first_name: StringArray = vec!["Alice", "Bob", "Charlie", "Eve"].into();
    let is_male: BooleanArray = vec![false, true, true, false].into();
    let columns: Vec<(&str, Arc<dyn Array>)> = vec![
        ("name", Arc::new(first_name)),
        ("is_male", Arc::new(is_male)),
        ("age", Arc::new(age)),
    ];

    let table = StructArray::try_from(columns).unwrap();
    let id = Uuid::new_v4();

    Ok(DatasetInfo::new(id, name, &table))
}

#[tracing::instrument(err)]
#[tauri::command]
pub fn list_datasets() -> Result<Vec<DatasetInfo>, SerializableError> {
    todo!();
}

#[tracing::instrument(err)]
#[tauri::command]
pub fn get_dataset_info(id: &str) -> Result<DatasetInfo, SerializableError> {
    todo!();
}

#[tracing::instrument(err)]
#[tauri::command]
pub fn read_dataset_page(
    id: &str,
    options: PaginationConfig,
) -> Result<DatasetPage, SerializableError> {
    todo!();
}

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct DatasetPage {
    pub total_records: usize,
    pub table: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct DatasetInfo {
    pub id: String,
    pub name: String,
    pub num_rows: usize,
    pub schema: Schema,
}

impl DatasetInfo {
    fn new(id: Uuid, name: &str, records: &StructArray) -> Self {
        let schema = Schema::for_struct_array(records);

        DatasetInfo {
            id: id.to_string(),
            name: name.to_string(),
            num_rows: records.len(),
            schema,
        }
    }
}
