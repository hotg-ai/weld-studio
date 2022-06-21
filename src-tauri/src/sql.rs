use std::fmt::{self, Display, Formatter};

use arrow::{ipc::writer::StreamWriter, record_batch::RecordBatch};

use crate::{errors::SerializableError, AppState};

const MAX_ROWS: usize = 128;

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn validate_sql(
    app: tauri::State<'_, AppState>,
    sql: &str,
) -> Result<ValidationResponse, SerializableError<ValidationFailed>> {
    let db = app.db().await;
    let mut stmt = db.prepare(sql).map_err(ValidationFailed::from)?;
    let row_count = stmt.row_count();

    let frames = stmt
        .query_arrow(duckdb::params![])
        .map_err(ValidationFailed::from)?;

    let schema = frames.get_schema();
    let mut records = Vec::new();
    let mut num_records = 0;

    for frame in frames {
        num_records += frame.num_rows();
        records.push(frame);

        if num_records >= MAX_ROWS {
            break;
        }
    }

    let record_batch = RecordBatch::concat(&schema, &records)?;

    Ok(ValidationResponse {
        row_count,
        preview: serialize_preview(&record_batch)?,
    })
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
    Other,
}

impl From<duckdb::Error> for ValidationFailed {
    fn from(e: duckdb::Error) -> Self {
        match e {
            _ => ValidationFailed::Other,
        }
    }
}

impl std::error::Error for ValidationFailed {}

impl Display for ValidationFailed {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            ValidationFailed::Other => write!(f, "Validation failed"),
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
