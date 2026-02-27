# OAuth Completion + Modal Focus Regression Fix Plan

### Incorporated review findings (2026-02-27)
- [x] Blocker: remove destructive account pruning side effects from read-path loading.
- [x] Blocker: add explicit keychain write verification for newly created accounts.
- [x] Blocker: stop dialog focus trap from re-focusing on parent re-renders.
- [x] Blocker: keep backend error transparency for OAuth completion failures.
- [ ] Open risk (non-blocker): keychain backend behavior may differ by host OS/keychain policy; keep diagnostics at command boundaries.

- Requested item: Fix two regressions: (1) OAuth callback ends with `Account not found: <uuid>` in modal, and (2) Add Account name input loses focus while typing.
- Status: Plan only

- Root cause + proof:
  - **Issue 1 (OAuth error)**
    - `complete_login` calls `add_account` then `set_active_account(&stored.id)` in `src-tauri/src/commands/oauth.rs`.
    - `set_active_account` throws `Account not found: {account_id}` when ID is absent in reloaded store (`src-tauri/src/auth/storage.rs`).
    - Current `load_accounts` mutates and prunes records with missing keychain secrets during read (`src-tauri/src/auth/storage.rs`), which can remove the newly added UUID before `set_active_account` validates it.
    - Evidence captured:
      - modal shows backend error with new UUID,
      - that UUID is absent from `~/.codex-switcher/accounts.json` after failure,
      - keychain lookup for `account:<uuid>` returns missing.
  - **Issue 2 (focus jumps out of name input)**
    - `useDialogFocusTrap` re-focuses first focusable element on each effect run (`src/hooks/useDialogFocusTrap.ts`).
    - Effect depends on `onRequestClose`; `AddAccountModal` derives this from `onClose`, and `App` currently passes inline `onClose={() => setIsAddModalOpen(false)}` in `src/App.tsx`.
    - `App` re-renders periodically via `useProcessMonitor` interval updates (`src/features/workbench/hooks/useProcessMonitor.ts`), causing focus trap effect reruns and focus steal from input.

- Chosen solution:
  - Fix data-path correctness first, then UX stability.
  - 1) Make account loading read-safe (no destructive pruning in hot read paths), and move stale-record recovery to explicit repair path.
  - 2) Add keychain roundtrip verification inside add-account flow so failures surface as keychain write/read errors, not downstream `Account not found`.
  - 3) Refactor dialog focus trap to autofocus only on open transition, and stabilize close callback wiring in app composition.
  - 4) Preserve raw backend error text in modal so operators see true backend failure causes.

- Task list (ordered):
  1. Add failing tests that lock current regressions.
     - Frontend: Add modal focus stability test (typing in account name must retain focus across parent rerender).
     - Frontend: Keep OAuth modal regression tests for opener-pending, duplicate start, stale cancellation.
     - Backend: Add storage-level testable helper(s) for reconciliation behavior (pure function/unit-testable) to prevent read-path destructive pruning.
  2. Refactor storage/account recovery boundaries.
     - Split read-path account loading from repair-path mutation in `src-tauri/src/auth/storage.rs`.
     - Ensure `load_accounts` remains non-destructive for command workflows (`complete_login`, `set_active_account`, `touch_account`).
     - Add explicit repair function for stale metadata/keychain drift and call it only from controlled recovery path.
  3. Harden add-account OAuth persistence guarantees.
     - After saving keychain secret in add-account path, immediately verify secret roundtrip (`save` then `load`) for same account id.
     - If verification fails, abort and return explicit keychain error context.
     - Keep complete-login sequence deterministic: add -> activate -> switch -> touch.
  4. Fix modal focus-steal mechanism.
     - Update `useDialogFocusTrap` to focus first element only when dialog transitions from closed to open.
     - Keep Escape/Tab trap behavior.
     - Stabilize `onClose` callback identity in `App` via `useCallback` and pass stable handler to modal.
  5. Regression validation + documentation updates.
     - Run full project quality gates.
     - Update docs if recovery behavior/operational troubleshooting changed.

- Tests:
  - Frontend targeted:
    - `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx`
    - new/updated focus stability test in modal or app-level modal integration.
    - `pnpm test -- src/App.test.tsx`
    - `pnpm test -- src/hooks/__tests__/useAccounts.test.ts`
  - Full frontend gate:
    - `pnpm run check:ui`
  - Backend gate:
    - `cargo check --manifest-path src-tauri/Cargo.toml`
    - add unit test(s) for storage reconciliation helper and run `cargo test --manifest-path src-tauri/Cargo.toml`

- Risks + mitigations:
  - Risk: changing storage loading semantics can affect startup recovery behavior.
    - Mitigation: isolate repair path, test with fixture-like store states (healthy, stale, mixed).
  - Risk: keychain roundtrip verification may fail on locked/denied keychain policies.
    - Mitigation: explicit actionable errors; never continue with partial metadata write.
  - Risk: focus-trap changes can regress keyboard accessibility.
    - Mitigation: tab-loop and Escape behavior tests; manual keyboard smoke check.

- Rollout/rollback:
  - Rollout:
    1. Merge fix set to `main`.
    2. Build and run `pnpm tauri build --bundles app`.
    3. Validate OAuth login end-to-end in built app.
  - Rollback:
    - Revert fix commits in reverse order and rebuild app bundle.
    - Restore prior known-good branch/tag if required.

- Open questions + minimum checks:
  - Open: Why keychain entry for freshly added OAuth account UUID is missing immediately after callback success.
  - Minimum check: instrument complete-login stages with account UUID + stage markers (`add_account saved`, `keychain roundtrip ok`, `set_active ok`, `switch ok`) and capture one failing run.
  - Open: Frequency of focus-loss event under process monitor tick.
  - Minimum check: add deterministic rerender-driven modal focus test and confirm failure before fix, pass after fix.
