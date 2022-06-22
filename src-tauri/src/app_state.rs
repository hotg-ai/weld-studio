use std::{ops::DerefMut, path::{Path, PathBuf}};

use anyhow::{Context, Error};
use duckdb::Connection;
use futures::lock::Mutex;

#[derive(Debug)]
pub struct AppState {
    home_dir: PathBuf,
    conn: Mutex<Connection>,
}

impl AppState {
    #[tracing::instrument(skip_all)]
    pub fn load(home_dir: impl Into<PathBuf>) -> Result<Self, Error> {
        let home_dir = home_dir.into();
        let db_file = home_dir.join("weld.db");

        std::fs::create_dir_all(&home_dir).with_context(|| {
            format!("Unable to create the \"{}\" directory", home_dir.display())
        })?;

        tracing::debug!(db = %db_file.display(), "Opening the Weld Database",);
        let conn = Connection::open(&db_file)
            .with_context(|| format!("Unable to open the database at \"{}\"", db_file.display()))?;
        let conn = Mutex::new(conn);

        Ok(AppState {
            home_dir,
            conn,
        })
    }

    pub fn home_dir(&self) -> &Path {
        &self.home_dir
    }

    pub async fn db(&self) -> impl DerefMut<Target = Connection> + '_ {
        self.conn.lock().await
    }
}
