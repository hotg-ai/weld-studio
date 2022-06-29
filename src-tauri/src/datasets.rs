use std::{collections::HashMap, sync::Arc};

use crate::shared::{ElementType, PaginationConfig, Schema, SerializableError};
use arrow::array::{Array, BooleanArray, Int32Array, StringArray, StructArray};
use ts_rs::TS;
use uuid::Uuid;

/// Create a new dataset based on a SQL query.
#[tracing::instrument(skip(_sql), err)]
#[tauri::command]
pub async fn create_dataset(name: &str, _sql: &str) -> Result<DatasetInfo, SerializableError> {
    // TODO: Actually create a dataset instead of using dummy data
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

    let tensors = tensors(&table, name);

    let tensor_info = tensors.iter().map(|(id, t)| TensorInfo {
        id: id.to_string(),
        display_name: t.display_name.to_string(),
        dimensions: t.dimensions.clone(),
        element_type: t.element_type,
    });

    Ok(DatasetInfo::new(id, name, &table, tensor_info))
}

fn tensors(_table: &StructArray, _dataset_name: &str) -> HashMap<Uuid, Tensor> {
    // TODO: copy this from the weld experiment
    HashMap::new()
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

#[derive(Debug, Clone, PartialEq, Eq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct DatasetPage {
    pub total_records: usize,
    pub table: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct DatasetInfo {
    pub id: String,
    pub display_name: String,
    pub num_rows: usize,
    pub schema: Schema,
    pub registered_tensors: Vec<TensorInfo>,
}

impl DatasetInfo {
    fn new(
        id: Uuid,
        name: &str,
        records: &StructArray,
        tensors: impl IntoIterator<Item = TensorInfo>,
    ) -> Self {
        let schema = Schema::for_struct_array(records);

        DatasetInfo {
            id: id.to_string(),
            display_name: name.to_string(),
            num_rows: records.len(),
            schema,
            registered_tensors: tensors.into_iter().collect(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct TensorInfo {
    pub id: String,
    pub display_name: String,
    pub dimensions: Vec<usize>,
    pub element_type: ElementType,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
struct Tensor {
    display_name: String,
    dimensions: Vec<usize>,
    element_type: ElementType,
    buffer: Vec<u8>,
}
