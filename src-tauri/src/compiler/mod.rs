mod database;

use std::sync::Arc;
use std::collections::HashMap;

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

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MyTensorDimensions {
    Dynamic,
    Fixed(Vec<u32>)
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MyElementType {
    U8,
    I8,
    U16,
    I16,
    U32,
    I32,
    F32,
    U64,
    I64,
    F64,
    /// A string as UTF-8 encoded bytes.
    Utf8,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct MyTensor {
    element_type: MyElementType,
    dimensions: Vec<u32>,
    buffer: Vec<u8>
}

impl From<&TensorResult> for MyTensor {
    fn from(item: &TensorResult) -> Self {
        MyTensor {
            element_type: my_element_type(&item.element_type),
            dimensions: item.dimensions.clone(),
            buffer: item.buffer.clone()

        }
    }
}

impl From<&MyTensor> for TensorResult {
    fn from(item: &MyTensor) -> Self {
        TensorResult {
            element_type: element_type(&item.element_type),
            dimensions: item.dimensions.clone(),
            buffer: item.buffer.clone()
        }
    }
}

fn my_element_type(x: &ElementType) -> MyElementType {
    match x {
        U8 => MyElementType::U8,
        I8 => MyElementType::I8,
        U16 => MyElementType::U16,
        I16 => MyElementType::I16,
        U32 => MyElementType::U32,
        I32 => MyElementType::I32,
        F32 => MyElementType::F32,
        U64 => MyElementType::U64,
        I64 => MyElementType::I64,
        F64 => MyElementType::F64,
        /// A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        Utf8 => MyElementType::Utf8,
    }
}

fn element_type(x: &MyElementType) -> ElementType {
    match x {
        U8 => ElementType::U8,
        I8 => ElementType::I8,
        U16 => ElementType::U16,
        I16 => ElementType::I16,
        U32 => ElementType::U32,
        I32 => ElementType::I32,
        F32 => ElementType::F32,
        U64 => ElementType::U64,
        I64 => ElementType::I64,
        F64 => ElementType::F64,
        /// A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        Utf8 => ElementType::Utf8,
    }
}


#[tauri::command]
pub async fn reune(zune: &[u8],
    input_tensors: HashMap<String, MyTensor>) -> Result<MyTensor, String> {

    let mut zune_engine =
        ZuneEngine::load(zune).map_err(|_| "Unable to initialize Zune Engine!")?;

    for (name, tensor) in &input_tensors {
        let input_tensor_node_names = zune_engine
            .get_input_tensor_names(name)
            .map_err(|_| format!("Unable to find column: {}", name).to_string())?;
        let default_tensor_name = &input_tensor_node_names[0];
        zune_engine.set_input_tensor(name, default_tensor_name, &tensor.into());
    }

    zune_engine.predict().map_err(|e| e.to_string())?;


    let output_node = zune_engine.output_nodes()[0].to_string();
    let output_node_input_name = zune_engine.get_input_tensor_names(&output_node).map_err(|e| e.to_string())?;
    let output_node_input_name = &output_node_input_name[0];
    let result = &zune_engine
                    .get_input_tensor(&output_node, output_node_input_name)
                    .ok_or_else(|| String::from("Unable to fetch the result"))?;

    Ok(result.into())
}
