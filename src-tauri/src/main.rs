#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use change_case::snake_case;
use tracing;
use tracing_subscriber::fmt::format::FmtSpan;

use std::path::Path;

use arrow::json;
use serde_json;

use std::sync::{
  atomic::{AtomicBool, Ordering},
  Mutex,
};

// use arrow::util::pretty::print_batches;
use duckdb::{params, Connection, Result};
// use serde::*;

#[derive(Debug)]
struct Running(AtomicBool);

#[derive(Debug)]
struct Cancelled(AtomicBool);

struct DefragStudioState {
  pub conn: Mutex<Connection>,
}

fn main() {
  tracing_subscriber::fmt()
      .with_env_filter("info")
      .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
      .init();
  let conn = Connection::open_in_memory().unwrap();
  let state = DefragStudioState {
      conn: Mutex::new(conn),
  };
  tracing::info!("Initializing Defrag Studio");
  tauri::Builder::default()
      .manage(state)
      .manage(Running(AtomicBool::new(false)))
      .manage(Cancelled(AtomicBool::new(false)))
      .invoke_handler(tauri::generate_handler![load_csv, run_sql])
      .run(tauri::generate_context!())
      .expect("error while running tauri application");
}

#[tauri::command]
#[tracing::instrument(skip(state), err)]
async fn load_csv(
  invoke_message: String,
  state: tauri::State<'_, DefragStudioState>,
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
      "create table \"{}\" as select * from read_csv_auto('{}');",
      table_name, invoke_message[0]
  );

  tracing::info!("CSV file loaded with schema: {}", &create_table);
  let conn = state.conn.lock().unwrap();
  let res = conn
      .execute(&create_table[..], params![])
      .map_err(|e| e.to_string())?;
  tracing::info!("{}", res);
  Ok(format!("{}", table_name))
}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct Record {}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct DataResponse {
  records: Vec<serde_json::Map<String, serde_json::Value>>,
}

#[tauri::command]
#[tracing::instrument(skip(cancel), err)]
async fn cancel(cancel: bool, cancelled: tauri::State<'_, Cancelled>) -> Result<(), String> {
  cancelled.0.store(cancel, Ordering::Relaxed);
  Ok(())
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
async fn run_sql(
  sql: String,
  state: tauri::State<'_, DefragStudioState>,
  cancel: tauri::State<'_, Cancelled>,
  running:  tauri::State<'_, Running>,
  window: tauri::Window,
) -> Result<(), String> {
  let is_running = running.0.load(Ordering::Relaxed);
  if is_running {
    cancel.0.store(true, Ordering::Relaxed);
    running.0.store(false, Ordering::Relaxed);
    tracing::info!("Running csv");
  }
  let conn = state
      .conn
      .lock()
      .map_err(|_e| String::from("Could not lock connection"))?;
  let mut stmt = conn
      .prepare(&sql[..])
      .map_err(|_e| format!("Could not prepare statement: {}", _e.to_string()))?;
  // let rbs = stmt.query_map([], |row| {
  //     let foo: bool = row.get(0)?;
  //     Ok(foo)
  // }).map_err(|_e| String::from("Could not query"))?;
  // let rbs: Vec<bool> = rbs.map(|m| m.unwrap()).collect();
  tracing::info!("Loading arrow");
  let batches = stmt.query_arrow(params![]).map_err(|e| e.to_string())?;
  cancel.0.store(false, Ordering::Relaxed);
  running.0.store(true, Ordering::Relaxed);
  for batch in batches {
      let cancelled: bool = cancel.0.load(Ordering::Relaxed);
      tracing::info!("Cancelled: {}", cancelled);
      if !cancelled {
          let _span = tracing::info_span!("batch", size = batch.num_rows()).entered();

          let json_rows: Vec<serde_json::Map<String, serde_json::Value>> =
              json::writer::record_batches_to_json_rows(&vec![batch][..]).unwrap();
          window
              .emit("load_arrow_row_batch", json_rows)
              .map_err(|e| e.to_string())?
      } else {
        cancel.0.store(false, Ordering::Relaxed);
        break;
      }
  }
  running.0.store(false, Ordering::Relaxed);
  // tracing::info!("Serializing arrow");
  //
  // tracing::info!("Finished Serializing {}: {:?}", sql, &rbs.len());
  //let records = DataResponse { records: json_rows };

  Ok(())
}