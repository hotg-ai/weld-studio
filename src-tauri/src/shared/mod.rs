//! Types that are shared between the backend and frontend.
//!
//! All of these types should be serializable and generate TypeScript bindings
//! using the [`ts_rs::TS`] trait.

mod arrow;
mod errors;

pub use self::{
    arrow::{DataType, Field, Schema},
    errors::SerializableError,
};
