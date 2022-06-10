mod database;

use std::sync::Arc;

use hotg_rune_compiler::{
    asset_loader::AssetLoader, codegen::Codegen, im::Vector, parse::Frontend, BuildConfig,
    Environment,
};
use hotg_rune_runtime::zune::{ElementType, TensorResult, ZuneEngine};

pub use self::database::Database;

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn compile(
    runefile: String,
    assets: tauri::State<'_, Arc<dyn AssetLoader + Send + Sync>>,
    cfg: tauri::State<'_, BuildConfig>,
) -> Result<Vector<u8>, String> {
    let assets = Arc::clone(&assets);
    let cfg = BuildConfig::clone(&cfg);

    let result = tokio::task::spawn_blocking(move || {
        let mut db = Database::new(assets);
        db.set_src(runefile.into());
        db.set_config(cfg);
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

#[tauri::command]
pub async fn run(zune: &[u8]) -> Option<TensorResult> {
    let mut zune_engine = ZuneEngine::load(zune).expect("Unable to initialize Zune Engine!");

    println!("input nodes {:?}", zune_engine.input_nodes());
    println!("output nodes {:?}", zune_engine.output_nodes());

    let input_tensor = TensorResult {
        element_type: ElementType::F32,
        dimensions: vec![1, 1],
        buffer: vec![0, 0, 0, 0],
    };

    zune_engine.set_input_tensor("rand", "input", &input_tensor);

    println!(
        "input tensor rand => {:?}",
        zune_engine.get_input_tensor("rand", "input")
    );

    zune_engine.predict().expect("Failed to run predict!");

    println!(
        "output tensor for sine: => {:?}",
        zune_engine.get_output_tensor("sine", "Identity")
    );

    let result = zune_engine.get_output_tensor("sine", "Identity");

    result
}
