use std::sync::Arc;

use anyhow::Error;
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use tauri::{Builder, CustomMenuItem, Manager, Menu, MenuItem, Submenu};

use crate::{
    legacy::{Cancelled, Running},
    AppState,
};

pub fn configure(state: AppState) -> Result<Builder<tauri::Wry>, Error> {
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

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()?;

    let build_config = BuildConfig {
        current_directory: std::env::current_dir()?,
        features: FeatureFlags::stable(),
    };

    let builder = Builder::default()
        .manage(state)
        .manage(Running::default())
        .manage(Cancelled::default())
        .manage(assets)
        .manage(client)
        .manage(build_config)
        .menu(menu)
        .on_menu_event(handle_menu_event)
        .on_window_event(handle_window_event)
        .invoke_handler(tauri::generate_handler![
            crate::legacy::load_csv,
            crate::legacy::run_sql,
            crate::legacy::get_tables,
            crate::legacy::save_data,
            crate::legacy::log_message,
            crate::compiler::compile,
            crate::runtime::reune,
            crate::wapm::known_proc_blocks,
            crate::sql::validate_sql,
        ]);

    Ok(builder)
}

fn handle_menu_event(event: tauri::WindowMenuEvent) {
    let window = event.window();

    match event.menu_item_id() {
        "quit" => {
            window.app_handle().exit(0);
        }
        "close" => {
            window.close().unwrap();
        }
        id => {
            tracing::warn!(id, "Unhandled menu event");
        }
    }
}

fn handle_window_event(event: tauri::GlobalWindowEvent<impl tauri::Runtime>) {
    match event.event() {
        tauri::WindowEvent::FileDrop(tauri::FileDropEvent::Dropped(paths)) => {
            tracing::warn!(?paths, "The user dragged some files onto the window");
        }
        tauri::WindowEvent::CloseRequested { .. } => tracing::debug!("Window was closed"),
        payload => tracing::trace!(?payload, "Ignoring a global window event"),
    }
}
