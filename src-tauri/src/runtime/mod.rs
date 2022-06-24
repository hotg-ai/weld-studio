use tauri::AppHandle;
use uuid::Uuid;

use crate::shared::{Analysis, ColumnMapping, Pipeline, SerializableError};

#[tauri::command]
pub fn execute_analysis(
    _app: AppHandle,
    _pipeline: Pipeline,
    _column_mapping: Vec<ColumnMapping>,
) -> Result<Analysis, SerializableError> {
    let id = Uuid::new_v4();
    let _span = tracing::info_span!("execute_analysis", id = %id);

    todo!();
}
