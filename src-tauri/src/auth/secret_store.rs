//! Secure credential storage backed by the OS keychain

use anyhow::{Context, Result};
use keyring::{Entry, Error as KeyringError};
use serde::{Deserialize, Serialize};

use crate::types::AuthData;

const SERVICE_NAME: &str = "codex-switcher";
const ACCOUNT_PREFIX: &str = "account:";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredSecret {
    auth_data: AuthData,
}

fn entry_for_account(account_id: &str) -> Result<Entry> {
    let username = format!("{ACCOUNT_PREFIX}{account_id}");
    Entry::new(SERVICE_NAME, &username).context("Failed to initialize keychain entry")
}

/// Save account credentials in the OS keychain.
pub fn save_account_secret(account_id: &str, auth_data: &AuthData) -> Result<()> {
    let entry = entry_for_account(account_id)?;
    let secret = serde_json::to_string(&StoredSecret {
        auth_data: auth_data.clone(),
    })
    .context("Failed to serialize account secret")?;

    entry
        .set_password(&secret)
        .with_context(|| format!("Failed to store credentials for account {account_id}"))?;

    Ok(())
}

/// Load account credentials from the OS keychain.
pub fn load_account_secret(account_id: &str) -> Result<Option<AuthData>> {
    let entry = entry_for_account(account_id)?;

    let secret = match entry.get_password() {
        Ok(secret) => secret,
        Err(KeyringError::NoEntry) => return Ok(None),
        Err(err) => {
            return Err(anyhow::anyhow!(
                "Failed to read credentials for account {account_id}: {err}"
            ))
        }
    };

    let parsed: StoredSecret = serde_json::from_str(&secret)
        .with_context(|| format!("Failed to parse keychain secret for account {account_id}"))?;

    Ok(Some(parsed.auth_data))
}

/// Delete account credentials from the OS keychain.
pub fn delete_account_secret(account_id: &str) -> Result<()> {
    let entry = entry_for_account(account_id)?;

    match entry.delete_credential() {
        Ok(_) | Err(KeyringError::NoEntry) => Ok(()),
        Err(err) => Err(anyhow::anyhow!(
            "Failed to delete credentials for account {account_id}: {err}"
        )),
    }
}
