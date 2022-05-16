#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_defrag_duckdb::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
