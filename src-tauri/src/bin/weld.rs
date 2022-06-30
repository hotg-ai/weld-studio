#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use anyhow::{Context, Error};
use duckdb::Result;

fn main() -> Result<(), Error> {
    weld::configure()
        .context("Unable to configure Tauri")?
        .run(tauri::generate_context!())
        .context("error while running tauri application")?;

    tracing::info!("Shutting down");

    Ok(())
}
