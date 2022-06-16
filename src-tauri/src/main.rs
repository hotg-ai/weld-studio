#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod compiler;
pub mod wapm;

use anyhow::{Context, Error};
use change_case::snake_case;
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use tracing;
use tracing_subscriber::{
    fmt::format::FmtSpan, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer, Registry,
};

use std::{
    fs::OpenOptions,
    path::{Path, PathBuf},
    sync::Arc,
};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

use arrow::json;
use serde_json;

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};

// use arrow::util::pretty::print_batches;
use arrow::record_batch::RecordBatch;
use duckdb::{params, Connection, Result};

use crate::{
    compiler::{compile, reune},
    wapm::known_proc_blocks,
};
// use serde::*;

#[derive(Debug)]
struct Running(AtomicBool);

#[derive(Debug)]
struct Cancelled(AtomicBool);

struct DefragStudioState {
    pub conn: Mutex<Connection>,
}

fn main() -> Result<(), Error> {
    initialize_logging();
    let conn = Connection::open_in_memory().unwrap();
    let state = DefragStudioState {
        conn: Mutex::new(conn),
    };
    tracing::info!("Initializing Defrag Studio");

    let submenu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::SelectAll)
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Quit),
    );
    let menu = Menu::new()
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);
    let assets: Arc<dyn AssetLoader + Send + Sync> =
        Arc::new(DefaultAssetLoader::default().cached());

    tauri::Builder::default()
        .manage(state)
        .manage(Running(AtomicBool::new(false)))
        .manage(Cancelled(AtomicBool::new(false)))
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "quit" => {
                std::process::exit(0);
            }
            "close" => {
                event.window().close().unwrap();
            }
            _ => {}
        })
        .manage(assets)
        .manage(
            reqwest::Client::builder()
                .danger_accept_invalid_certs(true)
                .build()?,
        )
        .manage(BuildConfig {
            current_directory: std::env::current_dir()?,
            features: FeatureFlags::stable(),
        })
        .invoke_handler(tauri::generate_handler![
            load_csv,
            run_sql,
            get_tables,
            compile,
            reune,
            known_proc_blocks
        ])
        .run(tauri::generate_context!())
        .context("error while running tauri application")
}

#[tauri::command]
#[tracing::instrument(skip(state, window), err)]
async fn load_csv(
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
    Ok(format!("{}", table_name))
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
async fn get_tables(
    state: tauri::State<'_, DefragStudioState>,
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

    let json_rows: Vec<serde_json::Map<String, serde_json::Value>> =
        json::writer::record_batches_to_json_rows(&batches[..]).map_err(|e| e.to_string())?;

    // let rbs: Vec<bool> = rbs.map(|m| m.unwrap()).collect();

    Ok(json_rows)
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
        .map_err(|_e| format!("Could not prepare statement: {}", _e.to_string()))?;
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
            sum = sum + json_rows.len() as i64;

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

fn initialize_logging() {
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var(
            "RUST_LOG",
            "warn,app=debug,hotg_rune_compiler=debug,hotg_rune_runtime=debug",
        );
    }

    let fmt = tracing_subscriber::fmt()
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
        .with_env_filter(EnvFilter::from_default_env())
        .finish();

    match file_logger() {
        Some((layer, path)) => {
            fmt.with(layer).init();
            tracing::info!(path = %path.display(), "Writing logs to disk");
        }
        None => {
            fmt.init();
        }
    };
}

/// Try to create a logger that will write to disk.
fn file_logger<S>() -> Option<(impl Layer<S>, PathBuf)>
where
    S: tracing::Subscriber + for<'a> tracing_subscriber::registry::LookupSpan<'a>,
{
    let project = directories::ProjectDirs::from("ai", "hotg", "weld")?;

    let log_dir = project.data_local_dir();
    std::fs::create_dir_all(log_dir).ok()?;

    let filename = log_dir.join("weld.log");
    let f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&filename)
        .ok()?;

    let layer = tracing_subscriber::fmt::layer()
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
        .json()
        .with_writer(Arc::new(f));

    Some((layer, filename))
}
