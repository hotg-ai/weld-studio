#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use arrow::datatypes::{DataType, Field, Schema};
use arrow::csv::reader::infer_schema_from_files;

fn main() {
  tauri::Builder::default()

    .invoke_handler(tauri::generate_handler![load_csv])
    .run(tauri::generate_context!())

    .expect("error while running tauri application");
}

#[tauri::command]
fn load_csv(invoke_message: String) {
  let invoke_message: Vec<String> = vec![invoke_message];
  let schema: Schema = infer_schema_from_files(&invoke_message[..], 0, Some(10), true).unwrap();
  println!("I was invoked from JS, with this message: {:?}", schema);
}