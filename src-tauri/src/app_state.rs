use std::{
    ops::DerefMut,
    path::{Path, PathBuf},
};

use anyhow::{Context, Error};
use duckdb::Connection;
use futures::lock::Mutex;

#[derive(Debug)]
pub struct AppState {
    home_dir: PathBuf,
    conn: Mutex<Connection>,
    meta_conn: Mutex<Connection>,
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

        let meta_conn = Mutex::new(prepare_meta_db(&home_dir)?);

        Ok(AppState {
            home_dir,
            conn,
            meta_conn,
        })
    }

    pub fn home_dir(&self) -> &Path {
        &self.home_dir
    }

    pub async fn db(&self) -> impl DerefMut<Target = Connection> + '_ {
        self.conn.lock().await
    }

    pub async fn meta_db(&self) -> impl DerefMut<Target = Connection> + '_ {
        self.meta_conn.lock().await
    }

    /**
     * try_get_db(): Blocking db connection
     */
    pub fn try_get_db(&self) -> Option<impl DerefMut<Target = Connection> + '_> {
        self.conn.try_lock()
    }
}

#[tracing::instrument(skip_all)]
pub fn prepare_meta_db(home_dir: &Path) -> Result<Connection, Error> {
    let db_file = home_dir.join("meta.db");
    let conn = Connection::open(&db_file).unwrap();

    conn.execute(
        "CREATE TABLE IF NOT EXISTS proc_blocks(name VARCHAR, version VARCHAR, publicUrl VARCHAR, fileLoc VARCHAR, createdAt timestamp default now()) ", []
    ).map_err(|e| Error::msg(e.to_string()))?;
    Ok(conn)
}
