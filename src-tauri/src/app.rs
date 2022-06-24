use std::{io::Cursor, sync::Arc};

use anyhow::Error;
use duckdb::params;
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use tauri::{Builder, CustomMenuItem, Manager, Menu, MenuItem, Submenu};

use crate::{
    legacy::{Cancelled, Running},
    AppState,
};

use crate::shared::Package;

use crate::wapm::fetch_packages;


use futures::{
    stream::{FuturesUnordered, StreamExt}
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
            let handle = app.app_handle();

            //let _splashscreen_window = app.get_window("splashscreen").unwrap();
            let main_window = app.get_window("main").unwrap();
            // we perform the initialization code on a new task so the app doesn't freeze
            tracing::info!("Initializing...");

            tauri::async_runtime::spawn(setup_weld(handle, main_window));
            Ok(())
        })
        .menu(menu)
        .on_menu_event(handle_menu_event)
        .on_window_event(handle_window_event)
        .invoke_handler(tauri::generate_handler![
            crate::datasets::create_dataset,
            crate::datasets::get_dataset_info,
            crate::datasets::list_datasets,
            crate::datasets::read_dataset_page,
            crate::logging::log_message,
            crate::runtime::execute_analysis,
            crate::sql::save_sql,
            crate::sql::validate_sql,
            crate::wapm::known_proc_blocks,
            // Legacy functions
            crate::compiler::compile,
            crate::legacy::get_tables,
            crate::legacy::load_csv,
            crate::legacy::run_sql,
            crate::legacy::save_data,
            crate::legacy::reune,
        ]);

    Ok(builder)
}


#[tracing::instrument(skip_all)]
async fn setup_weld(handle: tauri::AppHandle, main_window: tauri::Window) {
    let state: tauri::State<AppState> = handle.state();
    let client: tauri::State<reqwest::Client> = handle.state();
    let home_dir = state.home_dir();

    emit_splashscreen_progress(&main_window, 10, format!("Fetching manifest..."));

    let conn = state.meta_db().await;

    let packages = fetch_packages(client).await.unwrap();

    let packages_to_download: Vec<Package> = packages
        .into_iter()
        .filter(|package| {
            let package = package.to_owned();
            let name: &str = package.name.as_str();
            let version: &str = package.last_version.as_str();

            let found_pb = conn
                .execute(
                    "select version from proc_blocks where name = ? ",
                    params![&name],
                )
                .unwrap();

            if found_pb == 0 {
                // it doesn't exit
                tracing::info!("No record of {}", package.name);
                return true;
            }

            let found_pb = conn
                .execute(
                    "select version from proc_blocks where version = ? ",
                    params![&version],
                )
                .unwrap();
            tracing::info!("Found new version of {}", package.name);
            // it exists but has newer
            found_pb == 0
        })
        .collect();

    tracing::info!(packages_to_download=?packages_to_download);

    let mut futures = FuturesUnordered::new();

    for package in packages_to_download {
        let fut = async move {
            let p = package.clone();
            let response = reqwest::get(&package.public_url)
                .await
                .unwrap()
                .bytes()
                .await
                .unwrap();

            let proc_blocks_dir = home_dir
                .join("proc_blocks")
                .join(package.name)
                .join(package.last_version);
            match std::fs::create_dir_all(&proc_blocks_dir) {
                Ok(_) => tracing::info!("Dir made"),
                Err(e) => tracing::warn!("Dir err {:?}", e),
            }
            let file_name = proc_blocks_dir.join("pb.wasm");

            tracing::info!("Writing to {:?}", &file_name.as_os_str());
            match std::fs::File::create(file_name) {
                Ok(mut file) => {
                    let mut content = Cursor::new(response);

                    std::io::copy(&mut content, &mut file).ok();
                }
                Err(e) => tracing::warn!("File can't be written {:?}", e),
            }

            p
        };

        futures.push(fut);
    }

    let mut progress = 20;
    while let Some(package) = futures.next().await {
        let proc_blocks_dir = home_dir
            .join("proc_blocks")
            .join(&package.name)
            .join(&package.last_version);
        let file_loc = proc_blocks_dir.join("pb.wasm");
        progress += 1;
        // Note: The body is a Result<Bytes, Error> here
        tracing::info!("Writing {:?}", package);

        let _found_pb = conn
            .execute(
                
                "INSERT INTO proc_blocks (name, version, publicUrl, description, fileLoc, createdAt) VALUES (?, ?, ?, ?, ?, now())",
                params![
                    &package.name,
                    &package.last_version,
                    &package.public_url,
                    &package.description,
                    file_loc.as_path().to_str()
                ],
            )
            .unwrap();

        emit_splashscreen_progress(
            &main_window,
            progress,
            format!("Fetched package {}", package.name),
        );

    }
    
    emit_splashscreen_progress(&main_window, 100, format!("Done"));
    //splashscreen_window.close().unwrap();
    main_window.show().unwrap();
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