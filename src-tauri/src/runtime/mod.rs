use std::{collections::HashMap, fmt::Display};

use anyhow::{anyhow, Context, Error};
use hotg_rune_runtime::zune::{ElementType, TensorResult, ZuneEngine};

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn reune(
    zune: Vec<u8>,
    input_tensors: HashMap<String, MyTensor>,
    window: tauri::Window,
) -> Result<MyTensor, SeriazableError> {
    let mut zune_engine = ZuneEngine::load(&zune).context("Unable to initialize Zune Engine!")?;
    tracing::info!(input_nodes = ?zune_engine.input_nodes(), output_nodes=?zune_engine.output_nodes());
    for (name, tensor) in input_tensors {
        tracing::info!("Input Name: {name}");
        window.emit("reune_progress", &format!("Input Name: {name}")).map_err(|e| anyhow!(e.to_string()))?;
        let input_tensor_node_names = zune_engine
            .get_input_tensor_names(&name)
            .with_context(|| format!("Unable to find column: {name}"))?;

        let default_tensor_name = &input_tensor_node_names[0];

        let tensor = TensorResult::from(tensor);
        tracing::info!(
          %name,
          tensor_name=default_tensor_name.as_str(),
          ?tensor.element_type,
          ?tensor.dimensions,
          buffer_length = tensor.buffer.len(),
          "Setting an input tensor",
        );

        zune_engine.set_input_tensor(&name, default_tensor_name, &tensor);
    }

    if let Err(e) = zune_engine.predict() {
        tracing::error!(error = &*e as &dyn std::error::Error, "Unable to predict");
        return Err(e.into());
    }

    let output_node = zune_engine.output_nodes()[0].to_string();
    let output_node_input_name = zune_engine.get_input_tensor_names(&output_node)?;
    let output_node_input_name = &output_node_input_name[0];
    let tensor = zune_engine
        .get_input_tensor(&output_node, output_node_input_name)
        .context("Unable to fetch the result")?;

    tracing::debug!(
        node = %output_node,
        tensor.name = %output_node_input_name,
        ?tensor.element_type,
        ?tensor.dimensions,
        tensor.buffer_length = tensor.buffer.len(),
        "Received the result",
    );

    window.emit("reune_progress",&format!("reune: Successfully Received the result")).map_err(|e| anyhow!(e.to_string()))?;

    Ok(tensor.into())
}

#[derive(Debug, serde::Serialize)]
pub struct SeriazableError {
    error: String,
    causes: Vec<String>,
    backtrace: String,
}

impl From<Error> for SeriazableError {
    fn from(e: Error) -> Self {
        SeriazableError {
            error: e.to_string(),
            causes: e.chain().map(|e| e.to_string()).collect(),
            backtrace: format!("{e:?}"),
        }
    }
}

impl Display for SeriazableError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.error)
    }
}

#[derive(serde::Serialize, serde::Deserialize)]
pub enum MyTensorDimensions {
    Dynamic,
    Fixed(Vec<u32>),
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
    buffer: Vec<u8>,
}

impl From<TensorResult> for MyTensor {
    fn from(item: TensorResult) -> Self {
        MyTensor {
            element_type: my_element_type(item.element_type),
            dimensions: item.dimensions,
            buffer: item.buffer,
        }
    }
}

impl From<MyTensor> for TensorResult {
    fn from(item: MyTensor) -> Self {
        TensorResult {
            element_type: element_type(item.element_type),
            dimensions: item.dimensions,
            buffer: item.buffer,
        }
    }
}

fn my_element_type(x: ElementType) -> MyElementType {
    match x {
        ElementType::U8 => MyElementType::U8,
        ElementType::I8 => MyElementType::I8,
        ElementType::U16 => MyElementType::U16,
        ElementType::I16 => MyElementType::I16,
        ElementType::U32 => MyElementType::U32,
        ElementType::I32 => MyElementType::I32,
        ElementType::F32 => MyElementType::F32,
        ElementType::U64 => MyElementType::U64,
        ElementType::I64 => MyElementType::I64,
        ElementType::F64 => MyElementType::F64,
        // A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        ElementType::Utf8 => MyElementType::Utf8,
    }
}

fn element_type(x: MyElementType) -> ElementType {
    match x {
        MyElementType::U8 => ElementType::U8,
        MyElementType::I8 => ElementType::I8,
        MyElementType::U16 => ElementType::U16,
        MyElementType::I16 => ElementType::I16,
        MyElementType::U32 => ElementType::U32,
        MyElementType::I32 => ElementType::I32,
        MyElementType::F32 => ElementType::F32,
        MyElementType::U64 => ElementType::U64,
        MyElementType::I64 => ElementType::I64,
        MyElementType::F64 => ElementType::F64,
        // A string as UTF-8 encoded bytes. => MyElementType::/// A string as UTF-8 encoded bytes.
        MyElementType::Utf8 => ElementType::Utf8,
    }
}
