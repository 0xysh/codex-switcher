//! Account switching logic - writes credentials to ~/.codex/auth.json

use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};

use crate::auth::storage::{ensure_snapshots_dir, get_snapshots_dir};
use crate::types::{
    AuthData, AuthDotJson, AuthMode, CurrentAuthStatus, CurrentAuthSummary, StoredAccount,
    TokenData,
};

const KEYCHAIN_PLACEHOLDER: &str = "__stored_in_keychain__";

fn is_placeholder_value(value: &str) -> bool {
    value.is_empty() || value == KEYCHAIN_PLACEHOLDER
}

fn has_non_empty_value(value: Option<&str>) -> bool {
    value.is_some_and(|item| !item.trim().is_empty())
}

fn account_has_usable_credentials(account: &StoredAccount) -> bool {
    match &account.auth_data {
        AuthData::ApiKey { key } => !is_placeholder_value(key),
        AuthData::ChatGPT {
            id_token,
            access_token,
            refresh_token,
            ..
        } => {
            !is_placeholder_value(id_token)
                && !is_placeholder_value(access_token)
                && !is_placeholder_value(refresh_token)
        }
    }
}

/// Get the official Codex home directory
pub fn get_codex_home() -> Result<PathBuf> {
    // Check for CODEX_HOME environment variable first
    if let Ok(codex_home) = std::env::var("CODEX_HOME") {
        return Ok(PathBuf::from(codex_home));
    }

    let home = dirs::home_dir().context("Could not find home directory")?;
    Ok(home.join(".codex"))
}

/// Get the path to the official auth.json file
pub fn get_codex_auth_file() -> Result<PathBuf> {
    Ok(get_codex_home()?.join("auth.json"))
}

/// Switch to a specific account by writing its credentials to ~/.codex/auth.json
pub fn switch_to_account(account: &StoredAccount) -> Result<()> {
    if !account_has_usable_credentials(account) {
        anyhow::bail!(
            "Missing stored credentials for account '{}'. Re-add this account to restore access.",
            account.name
        );
    }

    let codex_home = get_codex_home()?;

    // Ensure the codex home directory exists
    fs::create_dir_all(&codex_home)
        .with_context(|| format!("Failed to create codex home: {}", codex_home.display()))?;

    let auth_json = create_auth_json(account)?;

    let auth_path = codex_home.join("auth.json");
    let content =
        serde_json::to_string_pretty(&auth_json).context("Failed to serialize auth.json")?;

    fs::write(&auth_path, content)
        .with_context(|| format!("Failed to write auth.json: {}", auth_path.display()))?;

    // Set restrictive permissions on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::Permissions::from_mode(0o600);
        fs::set_permissions(&auth_path, perms)?;
    }

    Ok(())
}

/// Create an AuthDotJson structure from a StoredAccount
fn create_auth_json(account: &StoredAccount) -> Result<AuthDotJson> {
    match &account.auth_data {
        AuthData::ApiKey { key } => Ok(AuthDotJson {
            openai_api_key: Some(key.clone()),
            tokens: None,
            last_refresh: None,
        }),
        AuthData::ChatGPT {
            id_token,
            access_token,
            refresh_token,
            account_id,
        } => Ok(AuthDotJson {
            openai_api_key: None,
            tokens: Some(TokenData {
                id_token: id_token.clone(),
                access_token: access_token.clone(),
                refresh_token: refresh_token.clone(),
                account_id: account_id.clone(),
            }),
            last_refresh: Some(Utc::now()),
        }),
    }
}

/// Import an account from an existing auth.json file
pub fn import_from_auth_json(path: &str, account_name: String) -> Result<StoredAccount> {
    let content =
        fs::read_to_string(path).with_context(|| format!("Failed to read auth.json: {path}"))?;

    let auth: AuthDotJson = serde_json::from_str(&content)
        .with_context(|| format!("Failed to parse auth.json: {path}"))?;

    // Determine auth mode and create account
    if let Some(api_key) = auth.openai_api_key {
        Ok(StoredAccount::new_api_key(account_name, api_key))
    } else if let Some(tokens) = auth.tokens {
        // Try to extract email and plan from id_token
        let (email, plan_type) = parse_id_token_claims(&tokens.id_token);

        Ok(StoredAccount::new_chatgpt(
            account_name,
            email,
            plan_type,
            tokens.id_token,
            tokens.access_token,
            tokens.refresh_token,
            tokens.account_id,
        ))
    } else {
        anyhow::bail!("auth.json contains neither API key nor tokens");
    }
}

/// Parse claims from a JWT ID token (without validation)
fn parse_id_token_claims(id_token: &str) -> (Option<String>, Option<String>) {
    let parts: Vec<&str> = id_token.split('.').collect();
    if parts.len() != 3 {
        return (None, None);
    }

    // Decode the payload (second part)
    let payload =
        match base64::Engine::decode(&base64::engine::general_purpose::URL_SAFE_NO_PAD, parts[1]) {
            Ok(bytes) => bytes,
            Err(_) => return (None, None),
        };

    let json: serde_json::Value = match serde_json::from_slice(&payload) {
        Ok(v) => v,
        Err(_) => return (None, None),
    };

    let email = json.get("email").and_then(|v| v.as_str()).map(String::from);

    // Look for plan type in the OpenAI auth claims
    let plan_type = json
        .get("https://api.openai.com/auth")
        .and_then(|auth| auth.get("chatgpt_plan_type"))
        .and_then(|v| v.as_str())
        .map(String::from);

    (email, plan_type)
}

/// Read the current auth.json file if it exists
pub fn read_current_auth() -> Result<Option<AuthDotJson>> {
    let path = get_codex_auth_file()?;

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read auth.json: {}", path.display()))?;

    let auth: AuthDotJson = serde_json::from_str(&content)
        .with_context(|| format!("Failed to parse auth.json: {}", path.display()))?;

    Ok(Some(auth))
}

fn to_iso_utc(time: std::time::SystemTime) -> Option<DateTime<Utc>> {
    Some(DateTime::<Utc>::from(time))
}

pub(crate) fn build_snapshot_filename(now: DateTime<Utc>, collision_index: u32) -> String {
    let timestamp = now.format("%Y%m%dT%H%M%SZ");
    if collision_index == 0 {
        format!("auth-snapshot-{timestamp}.json")
    } else {
        format!("auth-snapshot-{timestamp}-{collision_index}.json")
    }
}

pub(crate) fn derive_summary_from_auth(
    auth: &AuthDotJson,
    auth_file_path: String,
    snapshots_dir_path: String,
    last_modified_at: Option<DateTime<Utc>>,
) -> CurrentAuthSummary {
    if has_non_empty_value(auth.openai_api_key.as_deref()) {
        return CurrentAuthSummary {
            status: CurrentAuthStatus::Ready,
            auth_mode: Some(AuthMode::ApiKey),
            email: None,
            plan_type: None,
            auth_file_path,
            snapshots_dir_path,
            last_modified_at,
            message: None,
        };
    }

    if let Some(tokens) = &auth.tokens {
        if tokens.id_token.trim().is_empty()
            || tokens.access_token.trim().is_empty()
            || tokens.refresh_token.trim().is_empty()
        {
            return CurrentAuthSummary {
                status: CurrentAuthStatus::Invalid,
                auth_mode: None,
                email: None,
                plan_type: None,
                auth_file_path,
                snapshots_dir_path,
                last_modified_at,
                message: Some("auth.json contains empty token values".to_string()),
            };
        }

        let (email, plan_type) = parse_id_token_claims(&tokens.id_token);
        return CurrentAuthSummary {
            status: CurrentAuthStatus::Ready,
            auth_mode: Some(AuthMode::ChatGPT),
            email,
            plan_type,
            auth_file_path,
            snapshots_dir_path,
            last_modified_at,
            message: None,
        };
    }

    CurrentAuthSummary {
        status: CurrentAuthStatus::Invalid,
        auth_mode: None,
        email: None,
        plan_type: None,
        auth_file_path,
        snapshots_dir_path,
        last_modified_at,
        message: Some("auth.json contains neither API key nor tokens".to_string()),
    }
}

pub fn build_current_auth_summary() -> Result<CurrentAuthSummary> {
    let auth_path = get_codex_auth_file()?;
    let snapshots_dir = get_snapshots_dir()?;
    let auth_file_path = auth_path.display().to_string();
    let snapshots_dir_path = snapshots_dir.display().to_string();

    if !auth_path.exists() {
        return Ok(CurrentAuthSummary {
            status: CurrentAuthStatus::Missing,
            auth_mode: None,
            email: None,
            plan_type: None,
            auth_file_path,
            snapshots_dir_path,
            last_modified_at: None,
            message: Some("No active Codex session file was found".to_string()),
        });
    }

    let last_modified_at = fs::metadata(&auth_path)
        .ok()
        .and_then(|metadata| metadata.modified().ok())
        .and_then(to_iso_utc);

    let content = match fs::read_to_string(&auth_path) {
        Ok(content) => content,
        Err(err) => {
            return Ok(CurrentAuthSummary {
                status: CurrentAuthStatus::Error,
                auth_mode: None,
                email: None,
                plan_type: None,
                auth_file_path,
                snapshots_dir_path,
                last_modified_at,
                message: Some(format!("Failed to read auth.json: {err}")),
            });
        }
    };

    let auth: AuthDotJson = match serde_json::from_str(&content) {
        Ok(parsed) => parsed,
        Err(err) => {
            return Ok(CurrentAuthSummary {
                status: CurrentAuthStatus::Invalid,
                auth_mode: None,
                email: None,
                plan_type: None,
                auth_file_path,
                snapshots_dir_path,
                last_modified_at,
                message: Some(format!("Failed to parse auth.json: {err}")),
            });
        }
    };

    Ok(derive_summary_from_auth(
        &auth,
        auth_file_path,
        snapshots_dir_path,
        last_modified_at,
    ))
}

pub fn create_auth_snapshot_file() -> Result<String> {
    let auth_path = get_codex_auth_file()?;
    let auth_content = fs::read_to_string(&auth_path)
        .with_context(|| format!("Failed to read auth.json: {}", auth_path.display()))?;

    serde_json::from_str::<AuthDotJson>(&auth_content)
        .with_context(|| format!("Failed to parse auth.json: {}", auth_path.display()))?;

    let snapshots_dir = ensure_snapshots_dir()?;
    let now = Utc::now();

    for collision_index in 0..1000 {
        let filename = build_snapshot_filename(now, collision_index);
        let snapshot_path = snapshots_dir.join(filename);

        match std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&snapshot_path)
        {
            Ok(mut file) => {
                use std::io::Write;
                file.write_all(auth_content.as_bytes()).with_context(|| {
                    format!("Failed to write snapshot file: {}", snapshot_path.display())
                })?;

                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    fs::set_permissions(&snapshot_path, fs::Permissions::from_mode(0o600))
                        .with_context(|| {
                            format!(
                                "Failed to set permissions on snapshot file: {}",
                                snapshot_path.display()
                            )
                        })?;
                }

                return Ok(snapshot_path.display().to_string());
            }
            Err(err) if err.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(err) => {
                return Err(err).with_context(|| {
                    format!(
                        "Failed to create snapshot file: {}",
                        snapshot_path.display()
                    )
                });
            }
        }
    }

    anyhow::bail!(
        "Failed to create unique snapshot filename in {}",
        snapshots_dir.display()
    )
}

/// Check if there is an active Codex login
pub fn has_active_login() -> Result<bool> {
    match read_current_auth()? {
        Some(auth) => Ok(auth.openai_api_key.is_some() || auth.tokens.is_some()),
        None => Ok(false),
    }
}

#[cfg(test)]
mod tests {
    use super::{account_has_usable_credentials, StoredAccount};

    #[test]
    fn rejects_placeholder_chatgpt_credentials() {
        let mut account = StoredAccount::new_chatgpt(
            "Work".to_string(),
            Some("user@example.com".to_string()),
            Some("plus".to_string()),
            "__stored_in_keychain__".to_string(),
            "__stored_in_keychain__".to_string(),
            "__stored_in_keychain__".to_string(),
            Some("acc-1".to_string()),
        );
        account.id = "acc-1".to_string();

        assert!(!account_has_usable_credentials(&account));
    }

    #[test]
    fn accepts_real_chatgpt_credentials() {
        let mut account = StoredAccount::new_chatgpt(
            "Work".to_string(),
            Some("user@example.com".to_string()),
            Some("plus".to_string()),
            "id-real".to_string(),
            "access-real".to_string(),
            "refresh-real".to_string(),
            Some("acc-2".to_string()),
        );
        account.id = "acc-2".to_string();

        assert!(account_has_usable_credentials(&account));
    }
}
