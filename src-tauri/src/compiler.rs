use std::sync::Arc;

use hotg_rune_compiler::{
    asset_loader::AssetLoader,
    codegen::{Codegen, CodegenStorage},
    im::Vector,
    parse::{Frontend, FrontendStorage},
    BuildConfig, Environment, EnvironmentStorage,
};
use salsa::Storage;

use crate::shared::SerializableError;

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn compile(
    runefile: String,
    assets: tauri::State<'_, Arc<dyn AssetLoader + Send + Sync>>,
    cfg: tauri::State<'_, BuildConfig>,
    window: tauri::Window,
) -> Result<Vector<u8>, SerializableError> {
    let assets = Arc::clone(&assets);
    let cfg = BuildConfig::clone(&cfg);

    window.emit("compilation_progress", "Compilation Started")?;

    let result = tokio::task::spawn_blocking(move || {
        let mut db = Database::new(assets);
        db.set_src(runefile.into());
        db.set_config(cfg);
        db.rune_archive()
    })
    .await;

    window.emit("compilation_progress", "Compilation Finished")?;

    match result {
        Ok(Ok(rune)) => Ok(rune),
        Ok(Err(compile_error)) => {
            tracing::warn!(error = &*compile_error, "Compilation failed");
            Err(compile_error.into())
        }
        Err(e) => {
            tracing::error!(
                error = &e as &dyn std::error::Error,
                "Unable to wait for the compiler to finish running",
            );
            Err(e.into())
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
