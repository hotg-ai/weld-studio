use std::sync::Arc;

use hotg_rune_compiler::{
    codegen::CodegenStorage, parse::FrontendStorage, EnvironmentStorage, FileSystem,
};
use salsa::Storage;

use crate::compiler::cache::Cache;

#[salsa::database(CodegenStorage, FrontendStorage, EnvironmentStorage)]
pub struct Database {
    cache: Arc<Cache>,
    storage: Storage<Self>,
}

impl Database {
    pub fn with_cache(cache: Arc<Cache>) -> Self {
        let storage = Storage::default();
        Database { cache, storage }
    }
}

impl salsa::Database for Database {}

impl FileSystem for Database {
    fn read(
        &self,
        path: &uriparse::URI<'_>,
    ) -> Result<hotg_rune_compiler::im::Vector<u8>, hotg_rune_compiler::ReadError> {
        self.cache.read(path)
    }
}
