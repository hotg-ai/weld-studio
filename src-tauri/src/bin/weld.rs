#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::{Context, Error};
use duckdb::{Connection, Result};
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use std::{
    fs::OpenOptions,
    path::PathBuf,
    sync::{atomic::AtomicBool, Arc, Mutex},
};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tracing_subscriber::{
    fmt::format::FmtSpan, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer,
};
use weld::{Cancelled, DefragStudioState, Running};

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
            weld::load_csv,
            weld::run_sql,
            weld::get_tables,
            weld::compiler::compile,
            weld::compiler::reune,
            weld::wapm::known_proc_blocks,
            weld::save_data,
        ])
        .run(tauri::generate_context!())
        .context("error while running tauri application")
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
