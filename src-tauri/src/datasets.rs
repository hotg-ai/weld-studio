use std::{collections::HashMap, sync::Arc};

use arrow::array::{Array, BooleanArray, Int32Array, StringArray, StructArray};
use ts_rs::TS;
use uuid::Uuid;

use crate::errors::SerializableError;

#[tracing::instrument]
#[tauri::command(skip(sql))]
pub async fn create_dataset(name: &str, _sql: &str) -> Result<DatasetInfo, SerializableError> {
    let age: Int32Array = vec![10, 52, 42, 17].into();
    let first_name: StringArray = vec!["Alice", "Bob", "Charlie", "Eve"].into();
    let is_male: BooleanArray = vec![false, true, true, false].into();
    let columns: Vec<(&str, Arc<dyn Array>)> = vec![
        ("name", Arc::new(first_name)),
        ("is_male", Arc::new(is_male)),
        ("age", Arc::new(age)),
    ];

    let table = StructArray::try_from(columns).unwrap();
    let id = Uuid::new_v4();

    Ok(DatasetInfo::new(id, name, &table))
}

#[derive(Debug, Clone, PartialEq, TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct DatasetInfo {
    pub id: String,
    pub name: String,
    pub num_rows: usize,
    pub schema: Schema,
}

impl DatasetInfo {
    fn new(id: Uuid, name: &str, records: &StructArray) -> Self {
        let schema = Schema::for_struct_array(records);

        DatasetInfo {
            id: id.to_string(),
            name: name.to_string(),
            num_rows: records.len(),
            schema,
        }
    }
}

/// A duplicate of [`arrow::datatypes::Schema`] which implements the [`TS`]
/// trait.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Schema {
    pub fields: Vec<Field>,
    pub metadata: Option<HashMap<String, String>>,
}

impl Schema {
    pub fn for_struct_array(array: &StructArray) -> Self {
        let mut fields = Vec::new();

        for (name, array) in array.column_names().into_iter().zip(array.columns()) {
            let field = Field::from_column(name, array);
            fields.push(field);
        }

        Schema {
            fields,
            metadata: None,
        }
    }
}

/// A duplicate of [`arrow::datatypes::Field`] which implements the [`TS`]
/// trait.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize, TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub struct Field {
    pub name: String,
    pub data_type: DataType,
    pub nullable: bool,
    pub metadata: Option<HashMap<String, String>>,
}

impl Field {
    fn from_column(name: &str, array: &dyn Array) -> Self {
        let data_type = DataType::from(array.data_type().clone());

        Field {
            name: name.to_string(),
            nullable: array.null_count() > 0,
            data_type,
            metadata: None,
        }
    }
}

/// A duplicate of [`arrow::datatypes::DataType`] which implements the [`TS`]
/// trait.
#[derive(
    serde::Serialize, serde::Deserialize, Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord, TS,
)]
#[ts(export, export_to = "../src/backend/types/")]
pub enum DataType {
    Null,
    Boolean,
    Int8,
    Int16,
    Int32,
    Int64,
    UInt8,
    UInt16,
    UInt32,
    UInt64,
    Float16,
    Float32,
    Float64,
    Date32,
    Date64,
    Binary,
    FixedSizeBinary(i32),
    LargeBinary,
    Utf8,
    LargeUtf8,
    Dictionary(Box<DataType>, Box<DataType>),
    Decimal(usize, usize),
}

impl From<arrow::datatypes::DataType> for DataType {
    fn from(dt: arrow::datatypes::DataType) -> Self {
        match dt {
            arrow::datatypes::DataType::Null => DataType::Null,
            arrow::datatypes::DataType::Boolean => DataType::Boolean,
            arrow::datatypes::DataType::Int8 => DataType::Int8,
            arrow::datatypes::DataType::Int16 => DataType::Int16,
            arrow::datatypes::DataType::Int32 => DataType::Int32,
            arrow::datatypes::DataType::Int64 => DataType::Int64,
            arrow::datatypes::DataType::UInt8 => DataType::UInt8,
            arrow::datatypes::DataType::UInt16 => DataType::UInt16,
            arrow::datatypes::DataType::UInt32 => DataType::UInt32,
            arrow::datatypes::DataType::UInt64 => DataType::UInt64,
            arrow::datatypes::DataType::Float16 => DataType::Float16,
            arrow::datatypes::DataType::Float32 => DataType::Float32,
            arrow::datatypes::DataType::Float64 => DataType::Float64,
            arrow::datatypes::DataType::Date32 => DataType::Date32,
            arrow::datatypes::DataType::Date64 => DataType::Date64,
            arrow::datatypes::DataType::Binary => DataType::Binary,
            arrow::datatypes::DataType::FixedSizeBinary(i) => DataType::FixedSizeBinary(i),
            arrow::datatypes::DataType::LargeBinary => DataType::LargeBinary,
            arrow::datatypes::DataType::Utf8 => DataType::Utf8,
            arrow::datatypes::DataType::LargeUtf8 => DataType::LargeUtf8,
            arrow::datatypes::DataType::Dictionary(k, v) => {
                DataType::Dictionary(Box::new(DataType::from(*k)), Box::new(DataType::from(*v)))
            }
            arrow::datatypes::DataType::Decimal(a, b) => DataType::Decimal(a, b),
            other => unimplemented!("Unhandled data type {other:?}"),
        }
    }
}
