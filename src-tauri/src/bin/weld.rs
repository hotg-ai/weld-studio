#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::{Context, Error};
use directories::ProjectDirs;
use duckdb::Result;
use std::{fs::OpenOptions, path::Path, sync::Arc};
use tracing_subscriber::{
    fmt::format::FmtSpan, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer, Registry,
};
use weld::AppState;

fn main() -> Result<(), Error> {
    let project_dir = ProjectDirs::from("ai", "hotg", env!("CARGO_PKG_NAME"))
        .context("Unable to determine the project directory")?;
    let home = project_dir.data_local_dir();
    std::fs::create_dir_all(home)
        .with_context(|| format!("Unable to create the \"{}\" directory", home.display()))?;
    let log_file = home.join("weld.log");

    initialize_logging(&log_file).context("Unable to initialize logging")?;

    tracing::info!("Loading Weld Studio");
    let state = AppState::load(home).context("Unable to load the app state")?;

    weld::configure(state)
        .context("Unable to configure Tauri")?
        .run(tauri::generate_context!())
        .context("error while running tauri application")?;

    tracing::info!("Shutting down");

    Ok(())
}

fn initialize_logging(log_file: &Path) -> Result<(), Error> {
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var(
            "RUST_LOG",
            "warn,weld=debug,hotg_rune_compiler=debug,hotg_rune_runtime=debug",
        );
    }

    let console = tracing_subscriber::fmt::layer()
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
        .with_writer(std::io::stdout)
        .with_filter(EnvFilter::from_default_env());

    let f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)?;

    let file = tracing_subscriber::fmt::layer()
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
        .json()
        .with_writer(Arc::new(f))
        .with_filter(EnvFilter::from_default_env());

    Registry::default().with(console).with(file).init();

    tracing::info!(path = %log_file.display(), "Writing logs to disk");
    Ok(())
}
