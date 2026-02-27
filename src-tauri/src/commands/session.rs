//! Session summary and snapshot Tauri commands

use crate::auth::{build_current_auth_summary, create_auth_snapshot_file};
use crate::types::CurrentAuthSummary;

#[tauri::command]
pub async fn get_current_auth_summary() -> Result<CurrentAuthSummary, String> {
    build_current_auth_summary().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_auth_snapshot() -> Result<String, String> {
    create_auth_snapshot_file().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use crate::auth::{build_snapshot_filename, derive_summary_from_auth, ensure_snapshots_dir};
    use crate::types::{AuthDotJson, AuthMode, CurrentAuthStatus, TokenData};
    use chrono::Utc;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_home_dir() -> std::path::PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock drift")
            .as_nanos();
        std::env::temp_dir().join(format!("codex-switcher-session-tests-{suffix}"))
    }

    #[test]
    fn derives_ready_summary_from_chatgpt_auth_payload() {
        let auth = AuthDotJson {
            openai_api_key: None,
            tokens: Some(TokenData {
                id_token: "not-a-jwt".to_string(),
                access_token: "access-token".to_string(),
                refresh_token: "refresh-token".to_string(),
                account_id: Some("acct-1".to_string()),
            }),
            last_refresh: Some(Utc::now()),
        };

        let summary = derive_summary_from_auth(
            &auth,
            "/tmp/.codex/auth.json".to_string(),
            "/tmp/.codex-switcher/snapshots".to_string(),
            None,
        );

        assert!(matches!(summary.status, CurrentAuthStatus::Ready));
        assert!(matches!(summary.auth_mode, Some(AuthMode::ChatGPT)));
        assert_eq!(summary.auth_file_path, "/tmp/.codex/auth.json");
    }

    #[test]
    fn marks_summary_invalid_when_tokens_are_empty() {
        let auth = AuthDotJson {
            openai_api_key: None,
            tokens: Some(TokenData {
                id_token: "".to_string(),
                access_token: "access-token".to_string(),
                refresh_token: "refresh-token".to_string(),
                account_id: None,
            }),
            last_refresh: Some(Utc::now()),
        };

        let summary = derive_summary_from_auth(
            &auth,
            "/tmp/.codex/auth.json".to_string(),
            "/tmp/.codex-switcher/snapshots".to_string(),
            None,
        );

        assert!(matches!(summary.status, CurrentAuthStatus::Invalid));
    }

    #[test]
    fn snapshot_filename_changes_on_collision_index() {
        let now = Utc::now();
        let first = build_snapshot_filename(now, 0);
        let second = build_snapshot_filename(now, 1);

        assert_ne!(first, second);
        assert!(first.ends_with(".json"));
    }

    #[test]
    fn creates_snapshots_directory_with_restrictive_permissions() {
        let test_home = temp_home_dir();
        fs::create_dir_all(&test_home).expect("failed to create temp home");

        let previous_home = std::env::var("HOME").ok();
        // SAFETY: tests in this module do not spawn threads and restore HOME before return.
        unsafe {
            std::env::set_var("HOME", &test_home);
        }

        let snapshots_dir = ensure_snapshots_dir().expect("snapshots dir should be created");
        assert!(snapshots_dir.exists());

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mode = fs::metadata(&snapshots_dir)
                .expect("metadata should be readable")
                .permissions()
                .mode()
                & 0o777;
            assert_eq!(mode, 0o700);
        }

        if let Some(home) = previous_home {
            // SAFETY: restore process HOME after test mutation.
            unsafe {
                std::env::set_var("HOME", home);
            }
        }

        let _ = fs::remove_dir_all(&test_home);
    }
}
