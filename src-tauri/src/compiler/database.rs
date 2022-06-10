use std::sync::Arc;

use hotg_rune_compiler::{
    asset_loader::AssetLoader, codegen::CodegenStorage, parse::FrontendStorage, EnvironmentStorage,
};
use salsa::Storage;

#[salsa::database(CodegenStorage, FrontendStorage, EnvironmentStorage)]
pub struct Database {
    assets: Arc<dyn AssetLoader>,
    storage: Storage<Self>,
}

impl Database {
    pub fn new(assets: Arc<dyn AssetLoader>) -> Self {
        let storage = Storage::default();
        Database { assets, storage }
    }
}

impl salsa::Database for Database {}

impl AssetLoader for Database {
    fn read(
        &self,
        path: &uriparse::URI<'_>,
    ) -> Result<hotg_rune_compiler::im::Vector<u8>, hotg_rune_compiler::asset_loader::ReadError>
    {
        self.assets.read(path)
    }
}
