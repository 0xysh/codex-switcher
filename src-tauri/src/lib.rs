//! Codex Usage Inspector - Multi-account manager for Codex CLI

pub mod api;
pub mod auth;
pub mod commands;
pub mod types;

use commands::{
    add_account_from_file, cancel_login, check_codex_processes, complete_login, complete_reconnect,
    create_auth_snapshot, delete_account, get_active_account_info, get_current_auth_summary,
    get_usage, list_accounts, refresh_all_accounts_usage, rename_account, reorder_accounts,
    start_login, start_reconnect, switch_account,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // Account management
            list_accounts,
            get_active_account_info,
            add_account_from_file,
            switch_account,
            delete_account,
            rename_account,
            reorder_accounts,
            // OAuth
            start_login,
            complete_login,
            cancel_login,
            start_reconnect,
            complete_reconnect,
            // Usage
            get_usage,
            refresh_all_accounts_usage,
            // Process detection
            check_codex_processes,
            // Session snapshot manager
            get_current_auth_summary,
            create_auth_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
