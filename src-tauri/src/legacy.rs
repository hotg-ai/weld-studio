use std::{
    collections::HashMap,
    fmt::Display,
    path::Path,
    sync::atomic::{AtomicBool, Ordering},
};

use anyhow::{Context, Error};
use arrow::{json, record_batch::RecordBatch};
use hotg_rune_runtime::zune::{ElementType, TensorResult, ZuneEngine};

use crate::AppState;

#[derive(Debug, Default)]
pub struct Running(pub AtomicBool);

#[derive(Debug, Default)]
pub struct Cancelled(pub AtomicBool);

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
pub async fn load_csv(
    invoke_message: String,
    state: tauri::State<'_, AppState>,
    window: tauri::Window,
) -> Result<String, String> {
    let invoke_message: Vec<String> = vec![invoke_message];
    let table_name: &str = Path::new(&invoke_message[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap()
        .split('.')
        .collect::<Vec<&str>>()[0];
    let table_name = change_case::snake_case(table_name);

    // let file = File::open(&invoke_message[0]).unwrap();
    // let reader = csv::ReaderBuilder::new().has_header(true).infer_schema(Some(100));
    // let mut csv = reader.build(file).map_err(|e| e.to_string()).unwrap();
    // let schema = csv.schema();

    let create_table = format!(
        "create table \"{}\"  as select * from read_csv_auto('{}', SAMPLE_SIZE=-1);",
        table_name, invoke_message[0]
    );

    tracing::info!("CSV file loaded with schema: {}", &create_table);
    let conn = state.db().await;
    let res = conn
        .execute(&create_table[..], duckdb::params![])
        .map_err(|e| e.to_string())?;
    window
        .emit("load_csv_complete", serde_json::json!(res))
        .map_err(|e| e.to_string())?;
    tracing::info!("{}", res);
    Ok(table_name)
}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct Record {}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct DataResponse {
    records: Vec<serde_json::Map<String, serde_json::Value>>,
}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct TableData {
    name: String,
    columns: serde_json::Map<String, serde_json::Value>,
}

#[tauri::command]
#[tracing::instrument(skip(state), err)]
pub async fn get_tables(
    state: tauri::State<'_, AppState>,
    preload: Option<bool>,
) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, String> {
    let conn = state.db().await;

    let mut stmt = conn.prepare("show").map_err(|e| e.to_string())?;

    tracing::info!("querying");

    let batches: Vec<RecordBatch> = stmt
        .query_arrow(duckdb::params![])
        .map_err(|e| e.to_string())?
        .collect();

    let mut json_rows: Vec<serde_json::Map<String, serde_json::Value>> =
        json::writer::record_batches_to_json_rows(&batches[..]).map_err(|e| e.to_string())?;

    if (preload != None) && preload.unwrap() {
        for json_row in json_rows.iter_mut() {
            json_row.insert(
                String::from("group"),
                serde_json::Value::String(String::from("preloaded")),
            );
        }

        return Ok(json_rows);
    }
    Ok(json_rows)
}

#[tauri::command]
#[tracing::instrument(skip(cancel), err)]
pub async fn cancel(cancel: bool, cancelled: tauri::State<'_, Cancelled>) -> Result<(), String> {
    cancelled.0.store(cancel, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
pub async fn save_data(
    sql: String,
    file_loc: String,
    //format: SaveFormat, // CSV, JSON, Parquey for now CSV only
    state: tauri::State<'_, AppState>,
    cancel: tauri::State<'_, Cancelled>,
    running: tauri::State<'_, Running>,
    window: tauri::Window,
) -> Result<u32, String> {
    let is_running = running.0.load(Ordering::Relaxed);
    if is_running {
        cancel.0.store(true, Ordering::Relaxed);
        running.0.store(false, Ordering::Relaxed);
        tracing::info!("Running qsl");
    }
    let path = Path::new(&file_loc);

    let sql = format!(
        "COPY ({}) to '{}' WITH (HEADER 1, DELIMITER ',', FORMAT CSV, ENCODING 'UTF-8')",
        sql,
        path.display()
    );
    let conn = state.db().await;
    let mut stmt = conn
        .prepare(&sql[..])
        .map_err(|_e| format!("Could not prepare statement: {_e}"))?;
    // let rbs = stmt.query_map([], |row| {
    //     let foo: bool = row.get(0)?;
    //     Ok(foo)
    // }).map_err(|_e| String::from("Could not query"))?;
    // let rbs: Vec<bool> = rbs.map(|m| m.unwrap()).collect();
    tracing::info!("Loading arrow");
    window.emit("save_started", "").map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(duckdb::params![], |row| {
            let saved_amt: u32 = row.get(0)?;
            Ok(saved_amt)
        })
        .map_err(|e| e.to_string())?;

    let rows: Vec<u32> = rows.map(|m| m.unwrap()).collect();

    window.emit("save_ended", "").map_err(|e| e.to_string())?;

    // tracing::info!("Serializing arrow");
    //
    // tracing::info!("Finished Serializing {}: {:?}", sql, &rbs.len());
    //let records = DataResponse { records: json_rows };

    Ok(rows[0])
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
pub async fn run_sql(
    sql: String,
    state: tauri::State<'_, AppState>,
    cancel: tauri::State<'_, Cancelled>,
    running: tauri::State<'_, Running>,
    window: tauri::Window,
) -> Result<(), String> {
    let is_running = running.0.load(Ordering::Relaxed);
    if is_running {
        cancel.0.store(true, Ordering::Relaxed);
        running.0.store(false, Ordering::Relaxed);
        tracing::info!("Running qsl");
    }
    let conn = state.db().await;
    let mut stmt = conn
        .prepare(&sql[..])
        .map_err(|_e| format!("Could not prepare statement: {_e}"))?;
    // let rbs = stmt.query_map([], |row| {
    //     let foo: bool = row.get(0)?;
    //     Ok(foo)
    // }).map_err(|_e| String::from("Could not query"))?;
    // let rbs: Vec<bool> = rbs.map(|m| m.unwrap()).collect();
    tracing::info!("Loading arrow");
    window
        .emit("query_started", "")
        .map_err(|e| e.to_string())?;

    let batches = stmt
        .query_arrow(duckdb::params![])
        .map_err(|e| e.to_string())?;
    cancel.0.store(false, Ordering::Relaxed);
    running.0.store(true, Ordering::Relaxed);
    let mut sum: i64 = 0;

    let mut send_schema: bool = true;

    for batch in batches {
        let cancelled: bool = cancel.0.load(Ordering::Relaxed);
        tracing::info!("Cancelled: {}", cancelled);
        if !cancelled {
            let _span = tracing::info_span!("batch", size = batch.num_rows()).entered();

            if send_schema {
                window
                    .emit(
                        "load_arrow_row_batch_schema",
                        serde_json::json!(&batch.schema()),
                    )
                    .map_err(|e| e.to_string())?;
                send_schema = false;
            }

            let json_rows: Vec<serde_json::Map<String, serde_json::Value>> =
                json::writer::record_batches_to_json_rows(&vec![batch][..])
                    .map_err(|e| e.to_string())?;
            sum += json_rows.len() as i64;

            window
                .emit("load_arrow_row_batch", json_rows)
                .map_err(|e| e.to_string())?
        } else {
            cancel.0.store(false, Ordering::Relaxed);
            break;
        }
    }
    running.0.store(false, Ordering::Relaxed);

    window.emit("query_ended", sum).map_err(|e| e.to_string())?;
    // tracing::info!("Serializing arrow");
    //
    // tracing::info!("Finished Serializing {}: {:?}", sql, &rbs.len());
    //let records = DataResponse { records: json_rows };

    Ok(())
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn reune(
    window: tauri::Window,
    zune: Vec<u8>,
    input_tensors: HashMap<String, MyTensor>,
) -> Result<MyTensor, SeriazableError> {
    let mut zune_engine = ZuneEngine::load(&zune).context("Unable to initialize Zune Engine!")?;
    tracing::info!(input_nodes = ?zune_engine.input_nodes(), output_nodes=?zune_engine.output_nodes());
    for (name, tensor) in input_tensors {
        tracing::info!("Input Name: {name}");
        window
            .emit(
                "reune_progress",
                &format!("run: Setting Input Name: {name}"),
            )
            .map_err(Error::from)?;
        let input_tensor_node_names = zune_engine
            .get_input_tensor_names(&name)
            .with_context(|| format!("Unable to find column: {name}"))?;

        let default_tensor_name = &input_tensor_node_names[0];

        let tensor = TensorResult::from(tensor);
        tracing::info!(
          %name,
          tensor_name=default_tensor_name.as_str(),
          ?tensor.element_type,
          ?tensor.dimensions,
          buffer_length = tensor.buffer.len(),
          "Setting an input tensor",
        );

        zune_engine.set_input_tensor(&name, default_tensor_name, &tensor);
    }

    window
        .emit("reune_progress", "run: Starting Run")
        .map_err(Error::from)?;
    if let Err(e) = zune_engine.predict() {
        tracing::error!(error = &*e as &dyn std::error::Error, "Unable to predict");
        window
            .emit("reune_progress", "run: Run failed")
            .map_err(Error::from)?;
        return Err(e.into());
    }

    let output_node = zune_engine.output_nodes()[0].to_string();
    let output_node_input_name = zune_engine.get_input_tensor_names(&output_node)?;
    let output_node_input_name = &output_node_input_name[0];
    let tensor = zune_engine
        .get_input_tensor(&output_node, output_node_input_name)
        .context("Unable to fetch the result")?;

    tracing::debug!(
        node = %output_node,
        tensor.name = %output_node_input_name,
        ?tensor.element_type,
        ?tensor.dimensions,
        tensor.buffer_length = tensor.buffer.len(),
        "Received the result",
    );

    window
        .emit("reune_progress", "run: Successfully Received the result")
        .map_err(Error::from)?;

    Ok(tensor.into())
}

#[derive(Debug, serde::Serialize)]
pub struct SeriazableError {
    error: String,
    causes: Vec<String>,
    backtrace: String,
}

impl From<Error> for SeriazableError {
    fn from(e: Error) -> Self {
        SeriazableError {
            error: e.to_string(),
            causes: e.chain().map(|e| e.to_string()).collect(),
            backtrace: format!("{e:?}"),
        }
    }
}

impl Display for SeriazableError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.error)
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MyTensorDimensions {
    Dynamic,
    Fixed(Vec<u32>),
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MyElementType {
    U8,
    I8,
    U16,
    I16,
    U32,
    I32,
    F32,
    U64,
    I64,
    F64,
    /// A string as UTF-8 encoded bytes.
    Utf8,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MyTensor {
    element_type: MyElementType,
    dimensions: Vec<u32>,
    buffer: Vec<u8>,
}

impl From<TensorResult> for MyTensor {
    fn from(item: TensorResult) -> Self {
        MyTensor {
            element_type: my_element_type(item.element_type),
            dimensions: item.dimensions,
            buffer: item.buffer,
        }
    }
}

impl From<MyTensor> for TensorResult {
    fn from(item: MyTensor) -> Self {
        TensorResult {
            element_type: element_type(item.element_type),
            dimensions: item.dimensions,
            buffer: item.buffer,
        }
    }
}

fn my_element_type(x: ElementType) -> MyElementType {
    match x {
        ElementType::U8 => MyElementType::U8,
        ElementType::I8 => MyElementType::I8,
        ElementType::U16 => MyElementType::U16,
        ElementType::I16 => MyElementType::I16,
        ElementType::U32 => MyElementType::U32,
        ElementType::I32 => MyElementType::I32,
        ElementType::F32 => MyElementType::F32,
        ElementType::U64 => MyElementType::U64,
        ElementType::I64 => MyElementType::I64,
        ElementType::F64 => MyElementType::F64,
        // A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        ElementType::Utf8 => MyElementType::Utf8,
    }
}

fn element_type(x: MyElementType) -> ElementType {
    match x {
        MyElementType::U8 => ElementType::U8,
        MyElementType::I8 => ElementType::I8,
        MyElementType::U16 => ElementType::U16,
        MyElementType::I16 => ElementType::I16,
        MyElementType::U32 => ElementType::U32,
        MyElementType::I32 => ElementType::I32,
        MyElementType::F32 => ElementType::F32,
        MyElementType::U64 => ElementType::U64,
        MyElementType::I64 => ElementType::I64,
        MyElementType::F64 => ElementType::F64,
        // A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        MyElementType::Utf8 => ElementType::Utf8,
    }
}
