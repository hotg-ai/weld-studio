use std::{
    fmt::{self, Display, Formatter},
    path::Path,
};

use arrow::{ipc::writer::StreamWriter, record_batch::RecordBatch};

use crate::{shared::SerializableError, AppState};

/// Check whether a particular SQL statement is valid and get back the first
/// couple records.
///
/// In theory, you should be able to execute this command on every key press
/// as the user is writing their SQL query.
#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn validate_sql(
    app: tauri::State<'_, AppState>,
    sql: &str,
    max_rows: usize,
) -> Result<ValidationResponse, SerializableError<ValidationFailed>> {
    let db = app.db().await;
    let mut stmt = db.prepare(sql).map_err(ValidationFailed::from)?;

    let frames = stmt
        .query_arrow(duckdb::params![])
        .map_err(|e| ValidationFailed::from(e))?;

    let schema = frames.get_schema();
    let mut records = Vec::new();
    let mut num_records = 0;

    for frame in frames {
        num_records += frame.num_rows();
        records.push(frame);

        if num_records >= max_rows {
            break;
        }
    }
    let row_count = stmt.row_count();
    let record_batch = RecordBatch::concat(&schema, &records)?;

    Ok(ValidationResponse {
        row_count,
        preview: serialize_preview(&record_batch)?,
    })
}

/// Execute a SQL statement and save it to the provided path.
#[tauri::command]
#[tracing::instrument(skip(_app, _sql))]
pub async fn save_sql(
    _app: tauri::State<'_, AppState>,
    _sql: &str,
    path: &Path,
) -> Result<(), SerializableError> {
    todo!();
}

fn serialize_preview(record: &RecordBatch) -> Result<Vec<u8>, arrow::error::ArrowError> {
    let mut writer = StreamWriter::try_new(Vec::new(), &record.schema())?;
    writer.write(record)?;
    writer.into_inner()
}

/// Extra context for why a SQL statement might not be valid.
#[derive(Debug, serde::Serialize, serde::Deserialize, ts_rs::TS)]
#[ts(export, export_to = "../src/backend/types/")]
#[serde(tag = "type", content = "value")]
pub enum ValidationFailed {
    /// Something else.
    ///Message(String),
    Other(String),
}

impl From<duckdb::Error> for ValidationFailed {
    fn from(e: duckdb::Error) -> Self {
        match e {
            _ => ValidationFailed::Other(e.to_string()),
        }
    }
}

impl std::error::Error for ValidationFailed {}

impl Display for ValidationFailed {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            ValidationFailed::Other(_str) => write!(f, "{}", _str),
        }
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, ts_rs::TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct ValidationResponse {
    /// The total number of rows that were selected.
    pub row_count: usize,
    /// A preview of the first N records, serialized as an Apache Arrow array
    /// using their IPC format.
    pub preview: Vec<u8>,
}
