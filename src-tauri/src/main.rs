#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use arrow::datatypes::{DataType, Field, Schema};
use arrow::csv::reader::infer_schema_from_files;
use duckdb::{params, Connection, Result};
use std::sync::Mutex;

struct DefragStudioState {
  pub conn: Mutex<Connection>
}

fn main() {
  let conn = Connection::open_in_memory().unwrap();
  let state = DefragStudioState { conn: Mutex::new(conn) };
  tauri::Builder::default()
    .manage(state)
    .invoke_handler(tauri::generate_handler![load_csv])
    .run(tauri::generate_context!())

    .expect("error while running tauri application");
}

#[tauri::command]
fn load_csv(invoke_message: String, state: tauri::State<DefragStudioState>) {
  let invoke_message: Vec<String> = vec![invoke_message];
  let schema: Schema = infer_schema_from_files(&invoke_message[..], 0, Some(10), true).unwrap();
  let conn = state.conn.lock().unwrap();
  conn.execute("CREATE TABLE foo ( foo boolean );", params![]).unwrap();
  println!("I was invoked from JS, with this message: {:?}", schema);
}

#[tauri::command]
fn run_sql(sql: String) {
  println!("I was invoked from JS, with this message: {}", sql);
}