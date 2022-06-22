use std::{
    fmt::{Debug, Display, Formatter},
    marker::PhantomData,
};

use serde::Serialize;
use ts_rs::{Dependency, TS};

/// A serializable error that can be returned from any Tauri function.
#[derive(Debug)]
pub struct SerializableError<E = Infallible> {
    /// The actual error.
    pub error: anyhow::Error,
    pub message: String,
    pub causes: Vec<String>,
    pub verbose: String,
    state: PhantomData<E>,
}

impl SerializableError {
    pub fn new(error: anyhow::Error) -> Self {
        let message = error.to_string();
        let causes = error
            .chain()
            .skip(1)
            .map(|cause| cause.to_string())
            .collect();
        let verbose = format!("{error:?}");

        SerializableError {
            error,
            message,
            causes,
            verbose,
            state: PhantomData,
        }
    }
}

impl<E: std::error::Error + 'static> SerializableError<E> {
    /// If you know that somewhere inside the chain of errors is a particular
    /// type of error, you can use this [`SerializableError::downcast()`] method
    /// to serialize the error.
    ///
    /// # Example
    ///
    /// ```rust
    /// use weld::shared::SerializableError;
    ///
    /// #[derive(Debug, serde::Serialize)]
    /// struct SomeError {
    ///   field: u32,
    /// }
    /// # impl std::error::Error for SomeError {}
    /// # impl std::fmt::Display for SomeError {
    /// #   fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    /// #       write!(f, "An error occurred!")
    /// #   }
    /// # }
    /// # std::env::set_var("RUST_BACKTRACE", "0");
    ///
    /// // Create our error type and wrap it in a generic anyhow error
    /// let generic_error = anyhow::Error::new(SomeError { field: 42 });
    ///
    /// // get the serializable version of that error
    /// let serializable: SerializableError = generic_error.into();
    ///
    /// // By default, we won't get a state field
    /// assert_eq!(
    ///     serde_json::to_value(&serializable).unwrap(),
    ///     serde_json::json!({
    ///         "message": "An error occurred!",
    ///         "causes":[],
    ///         "verbose":"An error occurred!",
    ///     }),
    /// );
    ///
    /// // but we can use the downcast method to attach SomeError-specific state
    /// let specific: SerializableError<SomeError> = serializable.downcast();
    ///
    /// assert_eq!(
    ///     serde_json::to_value(&specific).unwrap(),
    ///     serde_json::json!({
    ///         "message": "An error occurred!",
    ///         "causes": [],
    ///         "verbose": "An error occurred!",
    ///         "state": {
    ///             "field": 42,
    ///         }
    ///     }),
    /// );
    /// ```
    pub fn downcast<E2>(self) -> SerializableError<E2> {
        let SerializableError {
            error,
            message,
            causes,
            verbose: backtrace,
            ..
        } = self;

        SerializableError {
            error,
            message,
            causes,
            verbose: backtrace,
            state: PhantomData,
        }
    }

    pub fn get_state(&self) -> Option<&E> {
        self.error.chain().find_map(|e| e.downcast_ref::<E>())
    }

    fn repr(&self) -> Repr<'_, E> {
        let SerializableError {
            message,
            causes,
            verbose,
            ..
        } = self;
        let state = self.get_state();

        Repr {
            message,
            causes,
            verbose,
            state,
        }
    }
}

impl<T, E> From<T> for SerializableError<E>
where
    T: Into<anyhow::Error>,
{
    fn from(error: T) -> Self {
        SerializableError::new(error.into()).downcast()
    }
}

impl<E: Serialize + std::error::Error + 'static> Serialize for SerializableError<E> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.repr().serialize(serializer)
    }
}

impl<E> std::ops::Deref for SerializableError<E> {
    type Target = anyhow::Error;

    fn deref(&self) -> &Self::Target {
        &self.error
    }
}

impl<E> Display for SerializableError<E> {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        Display::fmt(&self.error, f)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, serde::Serialize, serde::Deserialize, ts_rs::TS)]
#[ts(export, export_to = "../src/backend/types/")]
pub enum Infallible {}

impl Display for Infallible {
    fn fmt(&self, _: &mut Formatter<'_>) -> std::fmt::Result {
        match *self {}
    }
}

impl std::error::Error for Infallible {}

/// The actual type that gets passed to the backend.
#[derive(serde::Serialize)]
struct Repr<'a, E> {
    pub message: &'a str,
    pub causes: &'a [String],
    pub verbose: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<&'a E>,
}

impl<E: TS> TS for SerializableError<E> {
    const EXPORT_TO: Option<&'static str> = Some("../src/backend/types/SerializableError.ts");

    fn name() -> String {
        "SerializableError".to_string()
    }

    fn dependencies() -> Vec<Dependency> {
        vec![
            Dependency::from_ty::<Vec<String>>(),
            Dependency::from_ty::<String>(),
        ]
        .into_iter()
        .flatten()
        .collect()
    }

    fn transparent() -> bool {
        false
    }

    fn decl() -> String {
        r#"
interface SerializableError<E> {
    /** A human-readable message explaining the top-most error. */
    message: string,
    /** A list of errors that resulted in this error */
    causes: string[],
    /** A verbose stacktrace of the error. */
    verbose: string,
    /** Some optional, domain-specific data that describes this error. */
    state?: E,
}"#
        .to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn export_bindings_for_serializable_error() {
        <SerializableError>::export().unwrap();
    }
}
