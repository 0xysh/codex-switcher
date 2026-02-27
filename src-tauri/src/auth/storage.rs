//! Account storage module - manages reading and writing accounts.json

use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};

use crate::auth::secret_store::{delete_account_secret, load_account_secret, save_account_secret};
use crate::types::{AccountsStore, AuthData, StoredAccount};

const KEYCHAIN_PLACEHOLDER: &str = "__stored_in_keychain__";

fn is_placeholder_value(value: &str) -> bool {
    value.is_empty() || value == KEYCHAIN_PLACEHOLDER
}

fn auth_data_has_real_secrets(auth_data: &AuthData) -> bool {
    match auth_data {
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

fn redact_auth_data(auth_data: &mut AuthData) {
    match auth_data {
        AuthData::ApiKey { key } => {
            *key = KEYCHAIN_PLACEHOLDER.to_string();
        }
        AuthData::ChatGPT {
            id_token,
            access_token,
            refresh_token,
            ..
        } => {
            *id_token = KEYCHAIN_PLACEHOLDER.to_string();
            *access_token = KEYCHAIN_PLACEHOLDER.to_string();
            *refresh_token = KEYCHAIN_PLACEHOLDER.to_string();
        }
    }
}

/// Get the path to the codex-switcher config directory
pub fn get_config_dir() -> Result<PathBuf> {
    let home = dirs::home_dir().context("Could not find home directory")?;
    Ok(home.join(".codex-switcher"))
}

/// Get the path to accounts.json
pub fn get_accounts_file() -> Result<PathBuf> {
    Ok(get_config_dir()?.join("accounts.json"))
}

/// Load the accounts store from disk
pub fn load_accounts() -> Result<AccountsStore> {
    let path = get_accounts_file()?;

    if !path.exists() {
        return Ok(AccountsStore::default());
    }

    let content = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read accounts file: {}", path.display()))?;

    let mut store: AccountsStore = serde_json::from_str(&content)
        .with_context(|| format!("Failed to parse accounts file: {}", path.display()))?;

    let mut migrated_any_account = false;
    let mut removed_accounts: Vec<String> = Vec::new();
    let mut active_account_still_exists = false;
    let current_active_id = store.active_account_id.clone();
    let mut resolved_accounts = Vec::with_capacity(store.accounts.len());

    for mut account in store.accounts.into_iter() {
        match load_account_secret(&account.id).with_context(|| {
            format!(
                "Failed to load keychain credentials for account '{}'",
                account.name
            )
        })? {
            Some(auth_data) => {
                account.auth_data = auth_data;
                if current_active_id.as_deref() == Some(account.id.as_str()) {
                    active_account_still_exists = true;
                }
                resolved_accounts.push(account);
            }
            None => {
                if auth_data_has_real_secrets(&account.auth_data) {
                    save_account_secret(&account.id, &account.auth_data).with_context(|| {
                        format!(
                            "Failed to migrate account '{}' credentials into keychain",
                            account.name
                        )
                    })?;
                    migrated_any_account = true;
                    if current_active_id.as_deref() == Some(account.id.as_str()) {
                        active_account_still_exists = true;
                    }
                    resolved_accounts.push(account);
                } else {
                    removed_accounts.push(account.name.clone());
                }
            }
        }
    }

    store.accounts = resolved_accounts;

    if !active_account_still_exists {
        store.active_account_id = store.accounts.first().map(|account| account.id.clone());
    }

    if migrated_any_account || !removed_accounts.is_empty() {
        save_accounts(&store)?;
    }

    if !removed_accounts.is_empty() {
        eprintln!(
            "[Security] Removed {} account metadata record(s) with missing keychain credentials: {}",
            removed_accounts.len(),
            removed_accounts.join(", ")
        );
    }

    Ok(store)
}

/// Save the accounts store to disk
pub fn save_accounts(store: &AccountsStore) -> Result<()> {
    let path = get_accounts_file()?;

    let mut redacted_store = store.clone();
    for account in &mut redacted_store.accounts {
        redact_auth_data(&mut account.auth_data);
    }

    // Ensure the config directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    let content = serde_json::to_string_pretty(&redacted_store)
        .context("Failed to serialize accounts store")?;

    fs::write(&path, content)
        .with_context(|| format!("Failed to write accounts file: {}", path.display()))?;

    // Set restrictive permissions on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = fs::Permissions::from_mode(0o600);
        fs::set_permissions(&path, perms)?;
    }

    Ok(())
}

/// Add a new account to the store
pub fn add_account(account: StoredAccount) -> Result<StoredAccount> {
    let mut store = load_accounts()?;

    // Check for duplicate names
    if store.accounts.iter().any(|a| a.name == account.name) {
        anyhow::bail!("An account with name '{}' already exists", account.name);
    }

    save_account_secret(&account.id, &account.auth_data).with_context(|| {
        format!(
            "Failed to securely store credentials for account '{}'",
            account.name
        )
    })?;

    let account_clone = account.clone();
    store.accounts.push(account);

    // If this is the first account, make it active
    if store.accounts.len() == 1 {
        store.active_account_id = Some(account_clone.id.clone());
    }

    if let Err(err) = save_accounts(&store) {
        let _ = delete_account_secret(&account_clone.id);
        return Err(err);
    }

    Ok(account_clone)
}

/// Remove an account by ID
pub fn remove_account(account_id: &str) -> Result<()> {
    let mut store = load_accounts()?;

    let initial_len = store.accounts.len();
    store.accounts.retain(|a| a.id != account_id);

    if store.accounts.len() == initial_len {
        anyhow::bail!("Account not found: {account_id}");
    }

    // If we removed the active account, clear it or set to first available
    if store.active_account_id.as_deref() == Some(account_id) {
        store.active_account_id = store.accounts.first().map(|a| a.id.clone());
    }

    save_accounts(&store)?;

    if let Err(err) = delete_account_secret(account_id) {
        eprintln!(
            "[Security] Warning: failed to delete keychain credentials for account {account_id}: {err}"
        );
    }

    Ok(())
}

/// Update the active account ID
pub fn set_active_account(account_id: &str) -> Result<()> {
    let mut store = load_accounts()?;

    // Verify the account exists
    if !store.accounts.iter().any(|a| a.id == account_id) {
        anyhow::bail!("Account not found: {account_id}");
    }

    store.active_account_id = Some(account_id.to_string());
    save_accounts(&store)?;
    Ok(())
}

/// Get an account by ID
pub fn get_account(account_id: &str) -> Result<Option<StoredAccount>> {
    let store = load_accounts()?;
    Ok(store.accounts.into_iter().find(|a| a.id == account_id))
}

/// Get the currently active account
pub fn get_active_account() -> Result<Option<StoredAccount>> {
    let store = load_accounts()?;
    let active_id = match &store.active_account_id {
        Some(id) => id,
        None => return Ok(None),
    };
    Ok(store.accounts.into_iter().find(|a| a.id == *active_id))
}

/// Update an account's last_used_at timestamp
pub fn touch_account(account_id: &str) -> Result<()> {
    let mut store = load_accounts()?;

    if let Some(account) = store.accounts.iter_mut().find(|a| a.id == account_id) {
        account.last_used_at = Some(chrono::Utc::now());
        save_accounts(&store)?;
    }

    Ok(())
}

/// Update an account's metadata (name, email, plan_type)
pub fn update_account_metadata(
    account_id: &str,
    name: Option<String>,
    email: Option<String>,
    plan_type: Option<String>,
) -> Result<()> {
    let mut store = load_accounts()?;

    // Check for duplicate names first (if renaming)
    if let Some(ref new_name) = name {
        if store
            .accounts
            .iter()
            .any(|a| a.id != account_id && a.name == *new_name)
        {
            anyhow::bail!("An account with name '{new_name}' already exists");
        }
    }

    // Now find and update the account
    let account = store
        .accounts
        .iter_mut()
        .find(|a| a.id == account_id)
        .context("Account not found")?;

    if let Some(new_name) = name {
        account.name = new_name;
    }

    if email.is_some() {
        account.email = email;
    }

    if plan_type.is_some() {
        account.plan_type = plan_type;
    }

    save_accounts(&store)?;
    Ok(())
}
