#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use arrow::csv::reader::infer_schema_from_files;
use arrow::datatypes::{Schema};
// use arrow::record_batch::RecordBatch;
// use arrow::util::pretty::print_batches;
use duckdb::{params, Connection, Result};
// use serde::*;
// use serde_json;
use std::path::Path;
use std::sync::Mutex;
struct DefragStudioState {
    pub conn: Mutex<Connection>,
}

fn main() {
    let conn = Connection::open_in_memory().unwrap();
    let state = DefragStudioState {
        conn: Mutex::new(conn),
    };
    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![load_csv, run_sql])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn load_csv(invoke_message: String, state: tauri::State<DefragStudioState>) {
    let invoke_message: Vec<String> = vec![invoke_message];
    let _table_name: &str = Path::new(&invoke_message[0])
        .file_name()
        .unwrap()
        .to_str()
        .unwrap();
    let schema: Schema = infer_schema_from_files(&invoke_message[..], 1, Some(10), true).unwrap();
    let conn = state.conn.lock().unwrap();
    match conn.execute("CREATE TABLE foo ( foo boolean );", params![]) {
        Ok(_) => {
            for _i in 1..1000 {
                conn.execute("insert into foo values (true);", params![])
                    .unwrap();
            }
        }
        Err(_e) => {
            // for _ in 1..1000 {
            //     conn.execute("insert into foo values (false);", params![])
            //         .unwrap();
            // }
        }
    }

    println!("I was invoked from JS, with this message: {:?}", schema);
}

#[derive(serde::Serialize, Debug, serde::Deserialize)]
struct DataResponse {
    records: Vec<bool>,
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
    let rbs = stmt.query_map([], |row| {
        let foo: bool = row.get(0)?;
        Ok(foo)
    }).map_err(|_e| String::from("Could not query"))?;
    let rbs: Vec<bool> = rbs.map(|m| m.unwrap()).collect();
    println!("I am running {}: {:?}", sql, &rbs.len());
    let records = DataResponse { records: rbs };

    Ok(records)
}
