# Usage-First UI Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the app into a usage-first experience by removing switch/search/inspector complexity, keeping only the flows the user explicitly wants, and making every account card use the same layout.

**Architecture:** Keep backend command contracts and `useAccounts` API stable while reducing frontend orchestration surface. Remove switch-centric UI entry points (quick switch/search/switch CTA/inspector shortcuts) and keep only account usage management, process PID visibility, and recent activity. Preserve modular boundaries by simplifying `src/features/workbench/*` components instead of moving section logic back into `src/App.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest + Testing Library, Tauri invoke hooks.

---

### Incorporated review findings (2026-02-27)
- [x] Blocker: remove quick-switch/search/switch-only UI while preserving backend API compatibility.
- [x] Blocker: prevent active-card special casing; render a uniform account-card layout for all accounts.
- [x] Blocker: keep process PID visibility and recent activity while removing inspector/shortcuts chrome.
- [x] Blocker: avoid dead-state drift in `App.tsx` by deleting unused state/effects/hooks after UI removal.
- [ ] Open risk (non-blocker): command-level `switch_account` remains available (soft-deprecated in UI only).

### Product decisions locked by user

- Keep:
  - Recent Activity section
  - Process-running status text (`# Codex process is still running`)
  - Blocking PIDs chip
  - Account rename/delete/refresh actions
- Remove:
  - Inspector card
  - Shortcuts card
  - Search input
  - Quick switch button/dialog
  - Switch Safety card
  - Active Workspace card
  - Account Workspace controls/filter/sort/search
  - Switch Now / Active Now CTA on cards
  - Any separate needs-attention summary card (show status directly in each account card)
- Layout rule:
  - All account cards share one consistent layout (no special “main” active-card section)

### Target UX layout (post-change)

1. Top header (title + add account + refresh usage + theme toggle).
2. Compact process status row (process count + blocking PIDs when present).
3. Uniform account-card grid/list (all cards same visual structure and controls).
4. Recent Activity panel (kept, simplified, no inspector/shortcuts mixed in).

### Task 1: Lock the simplification behavior with failing tests

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Delete: `src/components/__tests__/QuickSwitchDialog.test.tsx`

**Step 1: Write failing tests first**
- Add app-level assertions that removed UI elements are absent:
  - no Inspector label,
  - no Shortcuts label,
  - no Quick switch button,
  - no search box placeholder.
- Add app-level assertions that required elements remain:
  - Recent Activity section visible,
  - process-running status visible,
  - Blocking PIDs visible when process monitor mock returns pids.
- Add/adjust account-card assertions ensuring active/inactive cards have the same control layout and no switch CTA text.

**Step 2: Run targeted tests (expect fail before implementation)**
- `pnpm test -- src/App.test.tsx src/components/__tests__/AccountCard.test.tsx`

**Step 3: Commit once tests are in and red state is validated**
- Commit message: `test(ui): lock usage-first simplification expectations`

### Task 2: Simplify App orchestration and remove dead state

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/workbench/index.ts`

**Step 1: Remove dead UI state/effects/hooks from App**
- Remove quick-switch/search/filter/sort/selected-account orchestration and handlers.
- Remove switch-specific orchestration (`handleSwitch`, switch-related state).
- Remove `useWorkbenchHotkeys` usage.
- Keep `useProcessMonitor`, `useActivityFeed`, add/refresh/delete/rename flows, and announcements.

**Step 2: Recompose main view to usage-first sections only**
- Use simplified header.
- Render compact process status panel/row.
- Render uniform account list section.
- Render recent activity section.

**Step 3: Run targeted checks**
- `pnpm exec tsc --noEmit`
- `pnpm test -- src/App.test.tsx`

**Step 4: Commit**
- Commit message: `refactor(ui): simplify app shell to usage-first layout`

### Task 3: Remove switch/search controls and inspector/shortcuts sections

**Files:**
- Modify: `src/features/workbench/components/WorkbenchHeader.tsx`
- Modify: `src/features/workbench/components/InspectorSidebar.tsx`
- Modify: `src/features/workbench/components/index.ts`
- Delete: `src/features/workbench/components/SwitchSafetyPanel.tsx`
- Delete: `src/features/workbench/components/ActiveWorkspacePanel.tsx`
- Delete: `src/features/workbench/components/AccountWorkspaceControls.tsx`
- Delete: `src/components/QuickSwitchDialog.tsx`
- Modify: `src/components/index.ts`

**Step 1: Header simplification**
- Remove search input and quick-switch CTA from `WorkbenchHeader`.
- Keep refresh/add/theme controls and high-signal title copy.

**Step 2: Sidebar simplification**
- Remove Inspector and Shortcuts sections.
- Keep Recent Activity section.
- Add/retain process status and Blocking PIDs display here or in a dedicated small panel component.

**Step 3: Remove obsolete components/exports**
- Delete switch/active-workspace/workspace-controls/quick-switch files.
- Clean exports to avoid dead imports.

**Step 4: Run targeted checks**
- `pnpm exec tsc --noEmit`
- `pnpm test -- src/App.test.tsx`

**Step 5: Commit**
- Commit message: `refactor(ui): remove switch-centric chrome and dialogs`

### Task 4: Make all account cards uniform and usage-first

**Files:**
- Modify: `src/features/workbench/components/AccountWorkspaceContent.tsx`
- Modify: `src/components/AccountCard.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`

**Step 1: Uniform list rendering**
- In `AccountWorkspaceContent`, stop active-vs-other split and render one normalized list/grid.
- Keep empty/loading/error states but remove switch-specific copy.

**Step 2: AccountCard cleanup**
- Remove switch-related props/UI states (`onSwitch`, `switching`, `switchDisabled`).
- Remove switch warning block and switch footer CTA branch.
- Keep same card layout for active/inactive accounts with status chips + usage + rename/refresh/delete/mask.

**Step 3: Run targeted checks**
- `pnpm test -- src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`
- `pnpm exec tsc --noEmit`

**Step 4: Commit**
- Commit message: `refactor(ui): unify account card layout and remove switch controls`

### Task 5: Remove now-unused feature hooks/selectors/types and keep compatibility

**Files:**
- Modify: `src/features/workbench/hooks/index.ts`
- Delete: `src/features/workbench/hooks/useWorkbenchHotkeys.ts`
- Modify: `src/features/workbench/selectors.ts`
- Modify: `src/features/workbench/types.ts`
- Modify: `src/features/workbench/__tests__/selectors.test.ts`

**Step 1: Cleanup feature APIs**
- Remove switch/search/filter/sort specific selectors/types only if no longer used.
- Keep `needsAttention` and `getRelativeTime` if used by cards/activity.

**Step 2: Compatibility guard**
- Keep backend commands and `useAccounts` method signatures unchanged (UI removal only).
- Do not remove `switchAccount` from hook contract in this pass; just stop using it in UI.

**Step 3: Run targeted checks**
- `pnpm test -- src/features/workbench/__tests__/selectors.test.ts`
- `pnpm exec tsc --noEmit`

**Step 4: Commit**
- Commit message: `chore(ui): remove dead workbench hooks and selector paths`

### Task 6: Documentation alignment for new UX scope

**Files:**
- Modify: `docs/ui-ux-architecture.md`
- Modify: `README.md`
- Modify: `AGENTS.md` (only if boundary language needs adjustment)

**Step 1: Update architecture docs**
- Document usage-first UI scope and removed switch/search/inspector surfaces.
- Keep accessibility and modularity requirements intact.

**Step 2: Run docs sanity check + final quality gates**
- `pnpm run check:ui`
- `cargo check --manifest-path src-tauri/Cargo.toml`

**Step 3: Commit**
- Commit message: `docs(ui): align architecture with usage-first interface`

### Task 7: Final validation and release-ready build

**Files:**
- No functional file edits expected; only final verification.

**Step 1: Full validation**
- `pnpm run check:ui`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`

**Step 2: Build distributable app**
- `pnpm tauri build --bundles app`

**Step 3: Publish commits**
- Push to `origin/main` only after all checks are green.

---

## Risks and mitigations

- **Risk:** UI removal breaks tests due to stale selectors/components.
  - **Mitigation:** test-first removal and per-task targeted runs.
- **Risk:** hidden coupling in App state causes runtime regressions after dead-code removal.
  - **Mitigation:** remove dead state incrementally; keep one task focused on orchestration cleanup.
- **Risk:** users lose ability to switch accounts from UI unexpectedly.
  - **Mitigation:** this is intentional per approved product decision; backend command remains for compatibility.

## Rollout and rollback

- **Rollout:** merge task commits in order -> run full gates -> build app bundle.
- **Rollback:** revert commits in reverse order to restore previous UI surfaces.

## Definition of Done (global)

- All requested removals are absent from UI.
- Recent Activity + process-running status + Blocking PIDs remain visible.
- All account cards render the same layout, with no dedicated “main active card” section.
- `pnpm run check:ui`, `cargo check`, and `cargo test` all pass.
- Docs updated and aligned with final UI behavior.
