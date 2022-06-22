#[tauri::command]
#[tracing::instrument(skip_all)]
pub fn log_message(message: &str) {
    tracing::info!("{}", message);
}
