use tauri::Manager;

use crate::app::file_opening;

pub fn show_and_focus_main_window(window: tauri::WebviewWindow) {
    if let Err(error) = window.show() {
        eprintln!("Failed to show window: {error}");
    }
    if let Err(error) = window.set_focus() {
        eprintln!("Failed to focus window: {error}");
    }
}

pub fn should_suppress_main_show(app_state: &file_opening::AppState) -> bool {
    app_state.consume_suppress_next_main_show()
}

#[tauri::command]
pub fn show_main_window(
    window: tauri::WebviewWindow,
    app_state: tauri::State<'_, file_opening::AppState>,
) {
    if should_suppress_main_show(&app_state) {
        return;
    }

    show_and_focus_main_window(window);
}

fn opened_files_present(app_state: &file_opening::AppState) -> bool {
    app_state
        .opened_files
        .lock()
        .ok()
        .map(|v| !v.is_empty())
        .unwrap_or(false)
}

fn mark_launched_for_file_open(app_state: &file_opening::AppState) {
    if let Ok(mut flag) = app_state.launched_for_file_open.lock() {
        *flag = true;
    }
}

fn is_launched_for_file_open(app_state: &file_opening::AppState) -> bool {
    app_state
        .launched_for_file_open
        .lock()
        .ok()
        .map(|v| *v)
        .unwrap_or(false)
}

fn handle_window_destroyed(app_handle: &tauri::AppHandle, label: &str) {
    if !label.starts_with("edit-") {
        return;
    }
    let app_state = app_handle.state::<file_opening::AppState>();
    if !is_launched_for_file_open(&app_state) {
        return;
    }
    // Count remaining edit windows (the destroyed one may still appear in the
    // window map briefly during this event — exclude by label).
    let remaining = app_handle
        .webview_windows()
        .iter()
        .filter(|(lbl, _)| {
            let l = lbl.as_str();
            l != label && l.starts_with("edit-")
        })
        .count();
    if remaining == 0 {
        app_handle.exit(0);
    }
}

pub fn handle_run_event(app_handle: &tauri::AppHandle, event: &tauri::RunEvent) {
    match event {
        tauri::RunEvent::Ready { .. } => {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let app_state = app_handle.state::<file_opening::AppState>();
                if opened_files_present(&app_state) {
                    // CLI args carried file paths (non-macOS launch with .md
                    // files). Tear down the main shell up front and remember
                    // the mode so we can quit when the last edit window closes.
                    mark_launched_for_file_open(&app_state);
                    let _ = main_window.destroy();
                } else {
                    // On macOS the file URLs arrive in RunEvent::Opened, which
                    // fires after Ready — opened_files is still empty here.
                    // file_opening::handle_opened_event handles destroy + flag
                    // for that path. For normal launch we just hide so the
                    // empty shell isn't visible.
                    let _ = main_window.hide();
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                // Open edit window if files were passed as command line arguments
                file_opening::open_edit_window_if_files_exist(app_handle);
            }
        }
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            // Show main window if it exists, otherwise create it
            if let Some(main_window) = app_handle.get_webview_window("main") {
                show_and_focus_main_window(main_window);
            }
        }
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Opened { urls } => {
            file_opening::handle_opened_event(app_handle, urls.clone());
        }
        tauri::RunEvent::WindowEvent { label, event, .. } => {
            if matches!(event, tauri::WindowEvent::Destroyed) {
                handle_window_destroyed(app_handle, label);
            }
        }
        _ => {}
    }
}
