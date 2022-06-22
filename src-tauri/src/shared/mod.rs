//! Types that are shared between the backend and frontend.
//!
//! All of these types should be serializable and generate TypeScript bindings
//! using the [`ts_rs::TS`] trait.

mod arrow;
mod errors;
mod package;

use ts_rs::TS;

pub use self::{
    arrow::{DataType, Field, Schema},
    errors::SerializableError,
    package::Package,
};

#[derive(Debug, Default, Clone, PartialEq, TS, serde::Serialize, serde::Deserialize)]
#[ts(export, export_to = "../src/backend/types/")]
#[serde(default)]
pub struct PaginationConfig {
    /// The index of the first record to show.
    pub offset: Option<usize>,
    /// The maximum number of records in this page.
    pub max_records: Option<usize>,
}
