mod cache;
mod database;

use std::sync::Arc;

use hotg_rune_compiler::{codegen::Codegen, im::Vector, parse::Frontend};

pub use self::{
    cache::{Cache, CachingStrategy},
    database::Database,
};

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn compile(
    runefile: String,
    cache: tauri::State<'_, Arc<Cache>>,
) -> Result<Vector<u8>, String> {
    let cache = Arc::clone(&cache);

    let result = tokio::task::spawn_blocking(move || {
        let mut db = Database::with_cache(cache);
        db.set_src(runefile.into());
        db.rune_archive()
    })
    .await;

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
