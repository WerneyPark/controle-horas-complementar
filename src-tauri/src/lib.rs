use std::{fs, path::PathBuf};
use tauri::Manager;

fn obter_caminho_dados(app: &tauri::AppHandle) -> Result<PathBuf, String> {
  let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
  Ok(app_dir.join("dados.json"))
}

#[tauri::command]
fn carregar_dados(app: tauri::AppHandle) -> Result<Option<String>, String> {
  let path = obter_caminho_dados(&app)?;
  if !path.exists() {
    return Ok(None);
  }
  let conteudo = fs::read_to_string(&path).map_err(|e| e.to_string())?;
  Ok(Some(conteudo))
}

#[tauri::command]
fn salvar_dados(app: tauri::AppHandle, conteudo: String) -> Result<bool, String> {
  let path = obter_caminho_dados(&app)?;
  let tmp = path.with_extension("json.tmp");
  fs::write(&tmp, &conteudo).map_err(|e| e.to_string())?;
  if path.exists() {
    let bak = path.with_extension("bak.json");
    let _ = fs::copy(&path, bak);
  }
  fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
  Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Info)
        .build(),
    )
    .invoke_handler(tauri::generate_handler![carregar_dados, salvar_dados])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
