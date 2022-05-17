#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use change_case::snake_case;
use std::fs::File;
use std::path::Path;
use std::sync::Mutex;

use arrow::datatypes::Schema;
use arrow::json;
use arrow::record_batch::RecordBatch;

// use arrow::util::pretty::print_batches;
use duckdb::{params, Connection, Result};
// use serde::*;
use serde_json;

struct DefragStudioState {
    pub conn: Mutex<Connection>,
    pub tables: Vec<Schema>,
}

fn main() {
    let conn = Connection::open_in_memory().unwrap();
    let state = DefragStudioState {
        conn: Mutex::new(conn),
        tables: Vec::new(),
    };
    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![load_csv, run_sql])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn load_csv(
    invoke_message: String,
    state: tauri::State<DefragStudioState>,
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

    println!("CSV file loaded with schema: {}", &create_table);
    let conn = state.conn.lock().unwrap();
    let res = conn
        .execute(&create_table[..], params![])
        .map_err(|e| e.to_string())?;
    println!("{}", res);
    Ok(format!("{}", table_name))
}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct Record {}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct DataResponse {
    records: Vec<serde_json::Map<String, serde_json::Value>>,
}

#[tauri::command]
fn run_sql(sql: String, state: tauri::State<DefragStudioState>) -> Result<DataResponse, String> {
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

    let rbs: Vec<RecordBatch> = stmt.query_arrow([]).map_err(|e| e.to_string())?.collect();

    let json_rows: Vec<serde_json::Map<String, serde_json::Value>> =
        json::writer::record_batches_to_json_rows(&rbs[..]).unwrap();
    println!("I am running {}: {:?}", sql, &rbs.len());
    let records = DataResponse { records: json_rows };

    Ok(records)
}
