use std::sync::Arc;

use anyhow::Error;
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use tauri::{Builder, CustomMenuItem, Menu, MenuItem, Submenu};

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
    Ok(Builder::default()
        .manage(state)
        .manage(Running::default())
        .manage(Cancelled::default())
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
        .manage(client)
        .manage(build_config)
        .invoke_handler(tauri::generate_handler![
            crate::legacy::load_csv,
            crate::legacy::run_sql,
            crate::legacy::get_tables,
            crate::legacy::save_data,
            crate::compiler::compile,
            crate::runtime::reune,
            crate::wapm::known_proc_blocks,
        ]))
}
