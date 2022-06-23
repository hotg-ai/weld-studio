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
        .setup(|app: &mut tauri::App| {
        
            let splashscreen_window = app.get_window("splashscreen").unwrap();
            let main_window = app.get_window("main").unwrap();
            // we perform the initialization code on a new task so the app doesn't freeze
            tracing::info!("Initializing...");
            tauri::async_runtime::spawn(async move {
                std::thread::sleep(std::time::Duration::from_millis(1000));

                emit_splashscreen_progress(&main_window, 20, format!("Loading data"));
               
             //  state.db().await?;

                std::thread::sleep(std::time::Duration::from_millis(2000));

                emit_splashscreen_progress(&main_window, 30, format!("Loading analytics"));

                tracing::info!("Done initializing.");
                
                std::thread::sleep(std::time::Duration::from_millis(500));

                emit_splashscreen_progress(&main_window, 90, format!("Initialized"));

                std::thread::sleep(std::time::Duration::from_secs(1));

                emit_splashscreen_progress(&main_window, 100, format!("Done"));

                main_window.show().unwrap();

                // After it's done, close the splashscreen and display the main window
                //splashscreen_window.close().unwrap(); // This is closing the main window fo some reason
            });
            Ok(())
        })
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

fn emit_splashscreen_progress(main_window: &tauri::Window, progress: i32, message: String) {
    main_window // not sure why spashscreen is main window
        .emit(
            "splashscreen_progress",
            serde_json::json!({"progress": progress, "message": message}),
        )
        .map_err(|e| e.to_string())
        .unwrap();
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
