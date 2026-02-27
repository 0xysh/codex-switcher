//! OAuth login Tauri commands

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::oneshot;

use crate::auth::oauth_server::{start_oauth_login, wait_for_oauth_login, OAuthLoginResult};
use crate::auth::{
    add_account, load_accounts, replace_account_chatgpt_credentials, set_active_account,
    switch_to_account, touch_account,
};
use crate::types::{AccountInfo, AuthData, AuthMode, OAuthLoginInfo};

enum PendingOAuthMode {
    CreateAccount,
    ReconnectAccount { account_id: String },
}

struct PendingOAuth {
    rx: oneshot::Receiver<anyhow::Result<OAuthLoginResult>>,
    cancelled: Arc<AtomicBool>,
    mode: PendingOAuthMode,
}

// Global state for pending OAuth login
static PENDING_OAUTH: Mutex<Option<PendingOAuth>> = Mutex::new(None);

/// Start the OAuth login flow
#[tauri::command]
pub async fn start_login(account_name: String) -> Result<OAuthLoginInfo, String> {
    // Cancel any previous pending flow so it does not keep the callback port occupied.
    if let Some(previous) = {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        pending.take()
    } {
        previous.cancelled.store(true, Ordering::Relaxed);
    }

    let (info, rx, cancelled) = start_oauth_login(account_name)
        .await
        .map_err(|e| e.to_string())?;

    // Store the receiver for later
    {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        *pending = Some(PendingOAuth {
            rx,
            cancelled,
            mode: PendingOAuthMode::CreateAccount,
        });
    }

    Ok(info)
}

/// Start OAuth reconnect flow for an existing account
#[tauri::command]
pub async fn start_reconnect(account_id: String) -> Result<OAuthLoginInfo, String> {
    let account_name = {
        let store = load_accounts().map_err(|e| e.to_string())?;
        let account = store
            .accounts
            .iter()
            .find(|a| a.id == account_id)
            .ok_or_else(|| format!("Account not found: {account_id}"))?;

        if account.auth_mode != AuthMode::ChatGPT {
            return Err("Reconnect is only available for ChatGPT OAuth accounts".to_string());
        }

        account.name.clone()
    };

    // Cancel any previous pending flow so it does not keep the callback port occupied.
    if let Some(previous) = {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        pending.take()
    } {
        previous.cancelled.store(true, Ordering::Relaxed);
    }

    let (info, rx, cancelled) = start_oauth_login(account_name)
        .await
        .map_err(|e| e.to_string())?;

    {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        *pending = Some(PendingOAuth {
            rx,
            cancelled,
            mode: PendingOAuthMode::ReconnectAccount { account_id },
        });
    }

    Ok(info)
}

/// Wait for the OAuth login to complete and add the account
#[tauri::command]
pub async fn complete_login() -> Result<AccountInfo, String> {
    let pending = {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        pending
            .take()
            .ok_or_else(|| "No pending OAuth login".to_string())?
    };

    if !matches!(pending.mode, PendingOAuthMode::CreateAccount) {
        return Err("Pending OAuth flow is not a new account login".to_string());
    }

    let account = wait_for_oauth_login(pending.rx)
        .await
        .map_err(|e| e.to_string())?;

    // Add the account to storage
    let stored = add_account(account).map_err(|e| e.to_string())?;

    // Make it active and switch to it
    set_active_account(&stored.id).map_err(|e| e.to_string())?;
    switch_to_account(&stored).map_err(|e| e.to_string())?;
    touch_account(&stored.id).map_err(|e| e.to_string())?;

    let store = load_accounts().map_err(|e| e.to_string())?;
    let active_id = store.active_account_id.as_deref();

    Ok(AccountInfo::from_stored(&stored, active_id))
}

/// Complete OAuth reconnect flow and replace stored credentials for existing account
#[tauri::command]
pub async fn complete_reconnect() -> Result<AccountInfo, String> {
    let pending = {
        let mut pending = PENDING_OAUTH.lock().unwrap();
        pending
            .take()
            .ok_or_else(|| "No pending OAuth reconnect".to_string())?
    };

    let account_id = match pending.mode {
        PendingOAuthMode::ReconnectAccount { account_id } => account_id,
        PendingOAuthMode::CreateAccount => {
            return Err("Pending OAuth flow is not a reconnect".to_string())
        }
    };

    let account = wait_for_oauth_login(pending.rx)
        .await
        .map_err(|e| e.to_string())?;

    let email = account.email.clone();
    let plan_type = account.plan_type.clone();

    let (id_token, access_token, refresh_token, provider_account_id) = match account.auth_data {
        AuthData::ChatGPT {
            id_token,
            access_token,
            refresh_token,
            account_id,
        } => (id_token, access_token, refresh_token, account_id),
        AuthData::ApiKey { .. } => {
            return Err("Unexpected OAuth result for reconnect".to_string());
        }
    };

    let updated = replace_account_chatgpt_credentials(
        &account_id,
        id_token,
        access_token,
        refresh_token,
        provider_account_id,
        email,
        plan_type,
    )
    .map_err(|e| e.to_string())?;

    set_active_account(&updated.id).map_err(|e| e.to_string())?;
    switch_to_account(&updated).map_err(|e| e.to_string())?;
    touch_account(&updated.id).map_err(|e| e.to_string())?;

    let store = load_accounts().map_err(|e| e.to_string())?;
    let active_id = store.active_account_id.as_deref();

    Ok(AccountInfo::from_stored(&updated, active_id))
}

/// Cancel a pending OAuth login
#[tauri::command]
pub async fn cancel_login() -> Result<(), String> {
    let mut pending = PENDING_OAUTH.lock().unwrap();
    if let Some(pending_oauth) = pending.take() {
        pending_oauth.cancelled.store(true, Ordering::Relaxed);
    }
    Ok(())
}
