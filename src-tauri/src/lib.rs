//! # Tauri 应用核心库

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![close_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
