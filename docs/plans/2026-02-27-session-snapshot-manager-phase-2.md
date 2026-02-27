# Session Snapshot Manager Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a professional, low-friction session snapshot workflow so the user can refresh current CLI auth identity, snapshot it, and import accounts without repeated browser logins.

**Architecture:** Keep backend and frontend contracts additive and backward compatible. Add a thin session-read + snapshot command layer in Rust, then wire a new usage-first UI card for refresh/snapshot/import flows. Reuse existing import command path (`add_account_from_file`) and default import picker to snapshots folder.

**Tech Stack:** Tauri v2 commands (Rust), React 19 + TypeScript, Tailwind CSS v4, Vitest + Testing Library.

---

## Design Decisions (from UI/UX skill + repo constraints)

- Card name: `Current Codex Session`
- Placement: near top of usage-first dashboard (high visibility, low clutter)
- Required actions: `Refresh`, `Save Snapshot`, `Import Snapshot`
- Status model: `ready`, `missing`, `invalid`, `error`
- Data shown: mode, email, plan, source file path, last modified time (no tokens)
- Accessibility: labeled controls, keyboard-friendly actions, polite live messages, no color-only status

## Acceptance Criteria

1. User can click `Refresh` and the card re-reads `~/.codex/auth.json` metadata.
2. User can click `Save Snapshot` and create a uniquely named file in `~/.codex-switcher/snapshots/`.
3. User can click `Import Snapshot`, and file picker opens by default in snapshots folder.
4. Import still uses existing account creation rules (duplicate-name checks, account list refresh).
5. No token values are displayed in UI or logs.
6. Existing backend command names and current app flows remain compatible.

## Task 1: Define backend session summary contract

**Files:**
- Modify: `src-tauri/src/types.rs`
- Modify: `src/types/index.ts`

**Step 1: Write failing type-usage test expectations**
- Add/adjust TS tests (or compile usage in app) that expect a `CurrentAuthSummary` shape.

**Step 2: Run check to confirm missing types fail now**
- Run: `pnpm exec tsc --noEmit`
- Expected: FAIL due to missing summary types.

**Step 3: Add minimal backend + frontend types**
- Add Rust/TS summary types including:
  - status
  - auth mode
  - email/plan (optional)
  - auth file path
  - snapshots dir path
  - last modified timestamp (optional)

**Step 4: Re-run type check**
- Run: `pnpm exec tsc --noEmit`
- Expected: PASS for new types.

**Step 5: Commit**
- `git commit -m "feat(session): add current auth summary types"`

## Task 2: Add backend commands for refresh and snapshot creation

**Files:**
- Create: `src-tauri/src/commands/session.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/auth/switcher.rs`
- Modify: `src-tauri/src/auth/storage.rs`

**Step 1: Write failing Rust tests for helper behavior**
- Add unit tests for:
  - current auth summary derivation
  - snapshot filename uniqueness
  - snapshots directory creation + restrictive perms (unix)

**Step 2: Run targeted tests to confirm fail first**
- Run: `cargo test --manifest-path src-tauri/Cargo.toml session::tests:: -- --nocapture`
- Expected: FAIL before implementation.

**Step 3: Implement minimal command set**
- Add `get_current_auth_summary` command.
- Add `create_auth_snapshot` command.
- Ensure no token payload is returned to frontend.
- Ensure snapshot writes are safe (`create_new` semantics) and permission hardened.

**Step 4: Run backend checks**
- Run:
  - `cargo fmt --manifest-path src-tauri/Cargo.toml`
  - `cargo test --manifest-path src-tauri/Cargo.toml session::tests:: -- --nocapture`
  - `cargo check --manifest-path src-tauri/Cargo.toml`
- Expected: PASS.

**Step 5: Commit**
- `git commit -m "feat(session): add current auth summary and snapshot commands"`

## Task 3: Extend frontend hook for session snapshot workflow

**Files:**
- Modify: `src/hooks/useAccounts.ts`
- Modify: `src/test/mocks/useAccounts.ts`
- (Optional test file) Create: `src/hooks/__tests__/useAccounts.session.test.ts`

**Step 1: Write failing hook tests for new actions**
- Add tests for:
  - `refreshCurrentSession` invokes summary command
  - `saveCurrentSessionSnapshot` invokes snapshot command
  - snapshots dir is exposed for import default path

**Step 2: Run targeted tests to confirm fail first**
- Run: `pnpm test -- src/hooks/__tests__/useAccounts.session.test.ts`
- Expected: FAIL before implementation.

**Step 3: Implement hook additions**
- Add state for current session summary.
- Add `refreshCurrentSession`.
- Add `saveCurrentSessionSnapshot`.
- Keep existing API methods untouched for compatibility.

**Step 4: Run targeted checks**
- Run:
  - `pnpm test -- src/hooks/__tests__/useAccounts.session.test.ts`
  - `pnpm exec tsc --noEmit`
- Expected: PASS.

**Step 5: Commit**
- `git commit -m "feat(session): add session summary and snapshot actions to useAccounts"`

## Task 4: Build Current Codex Session card with refresh/snapshot/import

**Files:**
- Create: `src/features/workbench/components/CurrentCodexSessionCard.tsx`
- Modify: `src/features/workbench/components/index.ts`
- Modify: `src/App.tsx`
- Create: `src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`

**Step 1: Write failing component tests first**
- Cover:
  - status rendering (`ready/missing/invalid/error`)
  - Refresh action calls hook callback
  - Save Snapshot action calls callback
  - Import Snapshot action calls callback

**Step 2: Run failing tests**
- Run: `pnpm test -- src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`
- Expected: FAIL before implementation.

**Step 3: Implement component and integrate into App**
- Add card to usage-first layout.
- Keep controls touch-friendly (`>=44px`) and fully labeled.
- Add clear success/error feedback text and live region updates.

**Step 4: Run targeted checks**
- Run:
  - `pnpm test -- src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx src/App.test.tsx`
  - `pnpm exec tsc --noEmit`
- Expected: PASS.

**Step 5: Commit**
- `git commit -m "feat(ui): add current codex session card with refresh and snapshot actions"`

## Task 5: Default import picker to snapshots folder

**Files:**
- Modify: `src/components/AddAccountModal.tsx`
- Modify: `src/components/__tests__/AddAccountModal.test.tsx`

**Step 1: Write failing test first**
- Assert file dialog opens with `defaultPath` set to snapshots dir from hook state.

**Step 2: Run targeted failing test**
- Run: `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx`
- Expected: FAIL before implementation.

**Step 3: Implement minimal dialog defaultPath wiring**
- Pass snapshots dir into modal.
- Add `defaultPath` in dialog `open(...)` options.

**Step 4: Run targeted checks**
- Run:
  - `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx`
  - `pnpm exec tsc --noEmit`
- Expected: PASS.

**Step 5: Commit**
- `git commit -m "feat(ui): default auth import picker to snapshots folder"`

## Task 6: Documentation updates and release validation

**Files:**
- Modify: `README.md`
- Modify: `docs/ui-ux-architecture.md`
- Modify: `AGENTS.md` (only if workflow rules need update)

**Step 1: Document snapshot workflow**
- Add section for:
  - Refresh current CLI session
  - Save snapshot
  - Import snapshot
  - security notes for local token files

**Step 2: Run full quality gate**
- Run:
  - `pnpm run check:ui`
  - `cargo check --manifest-path src-tauri/Cargo.toml`
  - `cargo test --manifest-path src-tauri/Cargo.toml`

**Step 3: Build app bundle**
- Run: `pnpm tauri build --bundles app`

**Step 4: Commit**
- `git commit -m "docs(session): add snapshot manager workflow guidance"`

---

## Risk Assessment

- Security risk: snapshot files contain credentials.
  - Mitigation: strict permissions, metadata-only UI, no secret logging.
- Compatibility risk: accidental backend contract drift.
  - Mitigation: additive commands only; no invoke name changes.
- UX risk: user confusion between app DB and auth snapshot files.
  - Mitigation: explicit labels and helper copy in card/modal.

## Rollout Steps

1. Merge task commits in order.
2. Run full gates.
3. Build app bundle.
4. Manual smoke test:
   - login in terminal
   - click Refresh
   - save snapshot
   - import snapshot
   - confirm account appears with usage refresh.

## Rollback Steps

1. Revert session-snapshot feature commits in reverse order.
2. Rebuild app bundle.
3. Verify existing add-account OAuth/import flows still work.

## Definition of Done

- Session card accurately reflects current CLI auth file state after manual refresh.
- Snapshot creation is reliable and non-destructive.
- Import dialog defaults to snapshot folder.
- No token leakage in UI/logs.
- All required checks pass.
