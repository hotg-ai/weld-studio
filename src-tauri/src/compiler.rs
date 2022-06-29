use std::sync::Arc;

use hotg_rune_compiler::{
    asset_loader::AssetLoader,
    codegen::{Codegen, CodegenStorage},
    im::Vector,
    parse::{Frontend, FrontendStorage},
    BuildConfig, Environment, EnvironmentStorage,
};
use salsa::Storage;

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn compile(
    runefile: String,
    assets: tauri::State<'_, Arc<dyn AssetLoader + Send + Sync>>,
    cfg: tauri::State<'_, BuildConfig>,
    window: tauri::Window,
) -> Result<Vector<u8>, String> {
    let assets = Arc::clone(&assets);
    let cfg = BuildConfig::clone(&cfg);

    window
        .emit("compilation_progress", "Compilation Started")
        .map_err(|e| e.to_string())?;

    let result = tokio::task::spawn_blocking(move || {
        let mut db = Database::new(assets);
        db.set_src(runefile.into());
        db.set_config(cfg);
        db.rune_archive()
    })
    .await;

    window
        .emit("compilation_progress", "Compilation Finished")
        .map_err(|e| e.to_string())?;

    match result {
        Ok(Ok(rune)) => Ok(rune),
        Ok(Err(compile_error)) => {
            tracing::warn!(error = &*compile_error, "Compilation failed");
            Err(compile_error.to_string())
        }
        Err(e) => {
            tracing::error!(
                error = &e as &dyn std::error::Error,
                "Unable to wait for the compiler to finish running",
            );
            Err(e.to_string())
        }
    }
}

#[salsa::database(CodegenStorage, FrontendStorage, EnvironmentStorage)]
pub struct Database {
    assets: Arc<dyn AssetLoader>,
    storage: Storage<Self>,
}

impl Database {
    pub fn new(assets: Arc<dyn AssetLoader>) -> Self {
        let storage = Storage::default();
        Database { assets, storage }
    }
}

impl salsa::Database for Database {}

impl AssetLoader for Database {
    fn read(
        &self,
        path: &uriparse::URI<'_>,
    ) -> Result<hotg_rune_compiler::im::Vector<u8>, hotg_rune_compiler::asset_loader::ReadError>
    {
        self.assets.read(path)
    }
}
