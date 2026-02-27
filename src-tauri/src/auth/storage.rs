//! Account storage module - manages reading and writing accounts.json

use std::fs;
use std::path::PathBuf;
use std::{collections::HashMap, collections::HashSet};

use anyhow::{Context, Result};

use crate::types::{AccountsStore, AuthData, AuthMode, StoredAccount};

const LEGACY_KEYCHAIN_PLACEHOLDER: &str = "__stored_in_keychain__";

fn account_has_legacy_placeholder(account: &StoredAccount) -> bool {
    match &account.auth_data {
        AuthData::ApiKey { key } => key == LEGACY_KEYCHAIN_PLACEHOLDER,
        AuthData::ChatGPT {
            id_token,
            access_token,
            refresh_token,
            ..
        } => {
            id_token == LEGACY_KEYCHAIN_PLACEHOLDER
                || access_token == LEGACY_KEYCHAIN_PLACEHOLDER
                || refresh_token == LEGACY_KEYCHAIN_PLACEHOLDER
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

/// Get the path to the session snapshots directory
pub fn get_snapshots_dir() -> Result<PathBuf> {
    Ok(get_config_dir()?.join("snapshots"))
}

/// Ensure snapshots directory exists with restrictive permissions
pub fn ensure_snapshots_dir() -> Result<PathBuf> {
    let path = get_snapshots_dir()?;
    fs::create_dir_all(&path)
        .with_context(|| format!("Failed to create snapshots directory: {}", path.display()))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o700)).with_context(|| {
            format!(
                "Failed to set permissions on snapshots directory: {}",
                path.display()
            )
        })?;
    }

    Ok(path)
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

    let initial_len = store.accounts.len();
    let mut removed_names: Vec<String> = Vec::new();

    store.accounts.retain(|account| {
        let keep = !account_has_legacy_placeholder(account);
        if !keep {
            removed_names.push(account.name.clone());
        }
        keep
    });

    if store.accounts.len() != initial_len {
        if store.active_account_id.as_ref().is_some_and(|active_id| {
            !store
                .accounts
                .iter()
                .any(|account| account.id == *active_id)
        }) {
            store.active_account_id = store.accounts.first().map(|account| account.id.clone());
        }

        save_accounts(&store)?;

        eprintln!(
            "[Compatibility] Removed {} legacy placeholder account record(s): {}",
            removed_names.len(),
            removed_names.join(", ")
        );
    }

    Ok(store)
}

/// Save the accounts store to disk
pub fn save_accounts(store: &AccountsStore) -> Result<()> {
    let path = get_accounts_file()?;

    // Ensure the config directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create config directory: {}", parent.display()))?;
    }

    let content =
        serde_json::to_string_pretty(store).context("Failed to serialize accounts store")?;

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

    let account_clone = account.clone();
    store.accounts.push(account);

    // If this is the first account, make it active
    if store.accounts.len() == 1 {
        store.active_account_id = Some(account_clone.id.clone());
    }

    save_accounts(&store)?;
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
    Ok(())
}

/// Persist a new explicit account ordering
pub fn reorder_accounts(account_ids: Vec<String>) -> Result<()> {
    let mut store = load_accounts()?;

    if store.accounts.len() != account_ids.len() {
        anyhow::bail!(
            "Account order size mismatch: expected {}, received {}",
            store.accounts.len(),
            account_ids.len()
        );
    }

    let expected_ids: HashSet<&str> = store
        .accounts
        .iter()
        .map(|account| account.id.as_str())
        .collect();
    let provided_ids: HashSet<&str> = account_ids.iter().map(String::as_str).collect();

    if provided_ids.len() != account_ids.len() {
        anyhow::bail!("Account order contains duplicate IDs");
    }

    if expected_ids != provided_ids {
        anyhow::bail!("Account order must include each stored account exactly once");
    }

    let mut accounts_by_id: HashMap<String, StoredAccount> = store
        .accounts
        .into_iter()
        .map(|account| (account.id.clone(), account))
        .collect();

    let mut reordered = Vec::with_capacity(account_ids.len());
    for account_id in account_ids {
        let account = accounts_by_id
            .remove(&account_id)
            .with_context(|| format!("Missing account in reorder payload: {account_id}"))?;
        reordered.push(account);
    }

    store.accounts = reordered;
    save_accounts(&store)?;
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

/// Replace OAuth credentials for an existing account without changing its ID/name
pub fn replace_account_chatgpt_credentials(
    account_id: &str,
    id_token: String,
    access_token: String,
    refresh_token: String,
    provider_account_id: Option<String>,
    email: Option<String>,
    plan_type: Option<String>,
) -> Result<StoredAccount> {
    let mut store = load_accounts()?;

    let account = store
        .accounts
        .iter_mut()
        .find(|a| a.id == account_id)
        .context("Account not found")?;

    account.auth_mode = AuthMode::ChatGPT;
    account.auth_data = AuthData::ChatGPT {
        id_token,
        access_token,
        refresh_token,
        account_id: provider_account_id,
    };
    account.email = email;
    account.plan_type = plan_type;

    let updated = account.clone();
    save_accounts(&store)?;
    Ok(updated)
}
