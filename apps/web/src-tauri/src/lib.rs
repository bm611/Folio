// TODO: Add Tauri commands here (e.g., AI chat proxy with secure API key storage)

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Folio.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running Folio");
}
