use std::{fs::OpenOptions, io::Cursor, path::Path, sync::Arc};

use anyhow::{Context, Error};
use arrow::record_batch::RecordBatch;
use duckdb::params;
use futures::stream::{FuturesUnordered, StreamExt};
use hotg_rune_compiler::{
    asset_loader::{AssetLoader, DefaultAssetLoader},
    BuildConfig, FeatureFlags,
};
use serde::Serialize;
use tauri::{Builder, CustomMenuItem, Manager, Menu, MenuItem, Submenu};
use tracing_subscriber::{
    fmt::format::FmtSpan, prelude::__tracing_subscriber_SubscriberExt, registry::LookupSpan,
    util::SubscriberInitExt, EnvFilter, Layer, Registry,
};

use crate::{
    legacy::{Cancelled, Running},
    shared::Package,
    wapm::fetch_packages,
    AppState,
};

pub fn configure() -> Result<Builder<tauri::Wry>, Error> {
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

    let rune_compiler_config = BuildConfig {
        current_directory: std::env::current_dir()?,
        features: FeatureFlags::stable(),
    };

    let builder = Builder::default()
        .manage(Running::default())
        .manage(Cancelled::default())
        .manage(assets)
        .manage(client)
        .manage(rune_compiler_config)
        .setup(|app: &mut tauri::App| {
            let paths = app.path_resolver();

            let log_dir = paths
                .log_dir()
                .context("Unable to determine the log directory")?;
            let log_file = log_dir.join("weld.log");

            initialize_logging(&log_file).context("Unable to initialize the logger")?;

            let home_dir = paths.app_dir().context("Unable to determine the app dir")?;
            let state = AppState::load(home_dir).context("Unable to load the app state")?;
            app.manage(state);

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

    emit_splashscreen_progress(&main_window, 10, "Fetching manifest...".to_string());

    let conn = state.meta_db().await;

    let packages = match fetch_packages(client).await {
        Ok(p) => p,
        Err(e) => {
            tracing::warn!(
                error = &e as &dyn std::error::Error,
                "Unable to fetch packages to check",
            );
            emit_splashscreen_progress(&main_window, 100, "Done".to_string());
            return;
        }
    };

    emit_splashscreen_progress(&main_window, 20, "Checking files".to_string());

    let packages_to_download: Vec<Package> = packages
        .into_iter()
        .filter(|package| {
            let name: &str = package.name.as_str();
            let version: &str = package.last_version.as_str();

            let mut stmt = conn
                .prepare("select version from proc_blocks where name = ? and version = ?")
                .unwrap();
            let found_pb = stmt.query_arrow(params![&name, &version]).unwrap();

            let found_pb: Vec<RecordBatch> = found_pb.collect();

            if found_pb.is_empty() {
                // it doesn't exit
                tracing::debug!("No record of {}", package.name);
                return true;
            }

            tracing::debug!("Found new version of {}", package.name);
            // it exists but has newer
            found_pb.is_empty()
        })
        .collect();

    tracing::debug!(packages_to_download=?packages_to_download);

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

            if let Err(e) = std::fs::create_dir_all(&proc_blocks_dir) {
                tracing::warn!("Dir err {:?}", e)
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

    emit_splashscreen_progress(&main_window, 100, "Done".to_string());
    //splashscreen_window.close().unwrap();
    main_window.show().unwrap();
}

fn emit_splashscreen_progress(
    main_window: &tauri::Window,
    progress: impl Serialize,
    message: String,
) {
    main_window // not sure why spashscreen is main window
        .emit(
            "splashscreen_progress",
            serde_json::json!({"progress": progress, "message": message}),
        )
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

    let file = file_logger(log_file);

    Registry::default().with(file).with(console).init();

    tracing::info!(path = %log_file.display(), "Writing logs to disk");
    Ok(())
}

fn file_logger<R>(log_file: &Path) -> Option<impl Layer<R>>
where
    R: tracing::Subscriber + for<'lookup> LookupSpan<'lookup>,
{
    if let Some(parent) = log_file.parent() {
        std::fs::create_dir_all(parent).ok()?;
    }

    let f = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_file)
        .ok()?;

    let layer = tracing_subscriber::fmt::layer()
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE)
        .json()
        .with_writer(Arc::new(f))
        .with_filter(EnvFilter::from_default_env());

    Some(layer)
}
