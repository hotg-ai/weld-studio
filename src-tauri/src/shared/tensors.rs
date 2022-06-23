use ts_rs::TS;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub enum ElementType {
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

#[derive(serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub enum Dimensions {
    Dynamic,
    Fixed(Vec<usize>),
}
