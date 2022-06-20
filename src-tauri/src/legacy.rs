use arrow::{json, record_batch::RecordBatch};
use change_case::snake_case;
use duckdb::{params, Connection, Result};
use std::{
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
};

#[derive(Debug)]
pub struct Running(pub AtomicBool);

#[derive(Debug)]
pub struct Cancelled(pub AtomicBool);

pub struct DefragStudioState {
    pub conn: Mutex<Connection>,
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
pub async fn load_csv(
    invoke_message: String,
    state: tauri::State<'_, DefragStudioState>,
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
    let table_name = snake_case(table_name);

    // let file = File::open(&invoke_message[0]).unwrap();
    // let reader = csv::ReaderBuilder::new().has_header(true).infer_schema(Some(100));
    // let mut csv = reader.build(file).map_err(|e| e.to_string()).unwrap();
    // let schema = csv.schema();

    let create_table = format!(
        "create table \"{}\"  as select * from read_csv_auto('{}', SAMPLE_SIZE=-1);",
        table_name, invoke_message[0]
    );

    tracing::info!("CSV file loaded with schema: {}", &create_table);
    let conn = state.conn.lock().unwrap();
    let res = conn
        .execute(&create_table[..], params![])
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
    state: tauri::State<'_, DefragStudioState>,
    preload: Option<bool>,
) -> Result<Vec<serde_json::Map<String, serde_json::Value>>, String> {
    let conn = state
        .conn
        .lock()
        .map_err(|_e| String::from("Could not lock connection"))?;

    let mut stmt = conn.prepare("show").map_err(|e| e.to_string())?;

    tracing::info!("querying");

    let batches: Vec<RecordBatch> = stmt
        .query_arrow(params![])
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
#[tracing::instrument(skip(), err)]
pub async fn log_message(message: String) -> Result<(), String> {
    tracing::info!("{}", message);
    Ok(())
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
pub async fn save_data(
    sql: String,
    file_loc: String,
    //format: SaveFormat, // CSV, JSON, Parquey for now CSV only
    state: tauri::State<'_, DefragStudioState>,
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
    let conn = state
        .conn
        .lock()
        .map_err(|_e| String::from("Could not lock connection"))?;
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
        .query_map(params![], |row| {
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
    state: tauri::State<'_, DefragStudioState>,
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
    let conn = state
        .conn
        .lock()
        .map_err(|_e| String::from("Could not lock connection"))?;
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

    let batches = stmt.query_arrow(params![]).map_err(|e| e.to_string())?;
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
