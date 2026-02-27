# Premium Visual Retouch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a distinctive, production-grade visual retouch for Codex Usage Inspector that feels premium, modern, and highly scannable in both light and dark themes.

**Architecture:** Apply a token-first visual redesign in `src/styles/tokens.css`, then cascade consistent visual updates through shared primitives (`Button`, `IconButton`, `ThemeToggle`) and high-impact surfaces (header, account cards, usage bars, session card, add-account modal). Keep product logic unchanged and preserve existing command contracts/hooks.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS variables, Vitest + Testing Library, Tauri v2.

---

## Working assumptions

- Run this in a dedicated worktree/branch.
- Keep functionality unchanged; this is visual + UX polish only.
- Preserve accessibility requirements (visible focus, aria labels, keyboard navigation, reduced motion support).
- Keep copy concise and utility-first.

## Visual direction locked

- **Aesthetic concept:** Midnight Instrument Atelier.
- **Mood:** premium control panel with clear telemetry hierarchy.
- **Color language:**
  - Brand/navigation: cobalt -> cyan.
  - 5h usage lane: cobalt family.
  - 7d usage lane: emerald family.
  - Warning/danger retain amber/red urgency semantics.
- **Typography:** characterful display + readable body; technical mono for telemetry.
- **Differentiator:** strong atmospheric depth + explicit information lanes (not generic SaaS gradients).

---

### Task 1: Lock regression tests for visual semantics

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Modify: `src/components/__tests__/UsageBar.test.tsx`

**Step 1: Add failing tests for required UI semantics**
- Add test assertions for section order in app shell:
  - header
  - account cards section
  - current session card
  - recent activity section
- Add account card assertions:
  - metadata row keeps credits on the email row right side.
  - "Updated …" chip is present in chip row.
  - standalone "Last updated" row is absent.
- Add usage bar assertions:
  - both 5h and weekly rows render distinct labels.
  - divider exists when both metrics exist.
  - reset text remains right-aligned.

**Step 2: Run targeted tests (expect failures before implementation if behavior differs)**
- Run: `pnpm test -- src/App.test.tsx src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx`

**Step 3: Commit test baselines**
- Run:
  - `git add src/App.test.tsx src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx`
  - `git commit -m "test(ui): lock premium retouch visual semantics"`

---

### Task 2: Rebuild the color token system (light + dark)

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `index.html`
- Modify: `src/App.css`

**Step 1: Implement token map v2**
- Update base tokens:
  - surface/canvas depth
  - text hierarchy
  - border hierarchy
  - accent, success, warning, danger
- Add explicit metric lane tokens:
  - `--usage-5h`, `--usage-5h-soft`
  - `--usage-7d`, `--usage-7d-soft`
- Add atmosphere/glow tokens for subtle depth.

**Step 2: Apply typography/environment polish**
- In `src/App.css`, tune typography rendering and heading wrapping behavior.
- Upgrade scrollbar styling to match premium accent system.
- In `index.html`, set light/dark `theme-color` metadata values to match canvas backgrounds.

**Step 3: Validate compile/build**
- Run:
  - `pnpm exec tsc --noEmit`
  - `pnpm build`

**Step 4: Commit**
- Run:
  - `git add src/styles/tokens.css src/App.css index.html`
  - `git commit -m "feat(ui): introduce premium dual-theme token system"`

---

### Task 3: Differentiate usage lanes for 5h and 7d scanability

**Files:**
- Modify: `src/components/UsageBar.tsx`
- Modify: `src/components/__tests__/UsageBar.test.tsx`

**Step 1: Refactor `UsageMetric` to support explicit lane variants**
- Add variant param:
  - `"five_hour"`
  - `"seven_day"`
- Map per-lane visual identity:
  - icon badge treatment
  - healthy-state text/bar color
- Keep warning/danger override logic for urgency.

**Step 2: Preserve readability rules**
- Keep `% left` as primary right-side metric.
- Keep reset line right-aligned and subordinate.
- Keep divider between 5h and 7d rows when both exist.

**Step 3: Validate**
- Run:
  - `pnpm test -- src/components/__tests__/UsageBar.test.tsx`
  - `pnpm build`

**Step 4: Commit**
- Run:
  - `git add src/components/UsageBar.tsx src/components/__tests__/UsageBar.test.tsx`
  - `git commit -m "feat(ui): differentiate 5h and weekly usage lanes"`

---

### Task 4: Polish account card hierarchy and density

**Files:**
- Modify: `src/components/AccountCard.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`

**Step 1: Refine structure without behavior changes**
- Keep:
  - rename interaction
  - credits on email row right side
  - status/meta chip row
  - updated chip in chip row right side
  - usage panel and footer actions
- Ensure no hover-lift transform remains.

**Step 2: Improve visual rhythm**
- Tighten spacing between identity, chip row, and usage block.
- Keep active-account emphasis subtle but visible.

**Step 3: Validate**
- Run:
  - `pnpm test -- src/components/__tests__/AccountCard.test.tsx`
  - `pnpm build`

**Step 4: Commit**
- Run:
  - `git add src/components/AccountCard.tsx src/components/__tests__/AccountCard.test.tsx`
  - `git commit -m "refactor(ui): polish account card hierarchy and metadata density"`

---

### Task 5: Workbench shell polish (header, session card, activity)

**Files:**
- Modify: `src/features/workbench/components/WorkbenchHeader.tsx`
- Modify: `src/features/workbench/components/CurrentCodexSessionCard.tsx`
- Modify: `src/features/workbench/components/InspectorSidebar.tsx`
- Modify: `src/App.tsx` (only if ordering/wiring polish is needed)

**Step 1: Header refinement**
- Increase distinction between title, subtitle, and telemetry chips.
- Ensure process chips remain legible in both themes.
- Keep sticky behavior unchanged.

**Step 2: Session/activity surface hierarchy**
- Keep Current Session card compact and action-forward.
- Keep Recent Activity dense but readable.
- Preserve all existing actions/states.

**Step 3: Validate**
- Run:
  - `pnpm test -- src/App.test.tsx src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`
  - `pnpm build`

**Step 4: Commit**
- Run:
  - `git add src/features/workbench/components/WorkbenchHeader.tsx src/features/workbench/components/CurrentCodexSessionCard.tsx src/features/workbench/components/InspectorSidebar.tsx src/App.tsx`
  - `git commit -m "refactor(ui): polish workbench shell hierarchy and telemetry"`

---

### Task 6: Modal + control family premium consistency

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/IconButton.tsx`
- Modify: `src/components/ui/ThemeToggle.tsx`
- Modify: `src/components/AddAccountModal.tsx`
- Modify: `src/components/add-account/AuthMethodTabs.tsx`
- Modify: `src/components/add-account/OAuthFlowPanel.tsx`
- Modify: `src/components/add-account/ImportCredentialsPanel.tsx`
- Modify: `src/components/add-account/AccountNameField.tsx`

**Step 1: Unify interaction language**
- Buttons:
  - premium primary treatment (gradient + elevated feel)
  - stronger secondary hover contrast
- Icon buttons/tabs:
  - clearer active/hover state separation
  - maintain touch target >= 44px.

**Step 2: Modal surface alignment**
- Apply token v2 consistently across panel, banners, tabs, and form fields.
- Keep error/warning semantics explicit and accessible.

**Step 3: Validate**
- Run:
  - `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx src/components/ui/Button.test.tsx`
  - `pnpm build`

**Step 4: Commit**
- Run:
  - `git add src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/ThemeToggle.tsx src/components/AddAccountModal.tsx src/components/add-account/AuthMethodTabs.tsx src/components/add-account/OAuthFlowPanel.tsx src/components/add-account/ImportCredentialsPanel.tsx src/components/add-account/AccountNameField.tsx`
  - `git commit -m "feat(ui): unify premium visual language across controls and modal"`

---

### Task 7: Rebrand string consistency check

**Files:**
- Modify as needed:
  - `README.md`
  - `src/features/workbench/components/WorkbenchHeader.tsx`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/src/lib.rs`
  - `src-tauri/src/types.rs`
  - `src-tauri/src/auth/oauth_server.rs`
  - `src/App.test.tsx`

**Step 1: Ensure all user-facing naming uses "Codex Usage Inspector"**
- Keep process self-filter compatibility for older app name string where needed.

**Step 2: Validate**
- Run:
  - `pnpm test -- src/App.test.tsx`
  - `pnpm build`
  - `cargo check --manifest-path src-tauri/Cargo.toml`

**Step 3: Commit**
- Run:
  - `git add README.md src/features/workbench/components/WorkbenchHeader.tsx src-tauri/tauri.conf.json src-tauri/src/lib.rs src-tauri/src/types.rs src-tauri/src/auth/oauth_server.rs src/App.test.tsx`
  - `git commit -m "chore(app): align rebrand copy to codex usage inspector"`

---

### Task 8: Final quality gate and distributable build

**Files:**
- No intended edits (fix-forward only if checks fail).

**Step 1: Run full checks**
- `pnpm run check:ui`
- `pnpm exec tsc --noEmit`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`

**Step 2: Build release bundle**
- `pnpm tauri build --bundles app`

**Step 3: Commit final fixes if any were needed**
- `git add -A`
- `git commit -m "chore(ui): finalize premium visual retouch quality pass"`

**Step 4: Push**
- `git push origin <branch-name>`

---

## Risks and mitigations

- **Risk:** Reduced readability from aggressive styling.
  - **Mitigation:** enforce hierarchy checks (`% left` > reset text, title > subtitle > chips).
- **Risk:** Light/dark contrast regressions.
  - **Mitigation:** verify text contrast manually on key surfaces and preserve state semantic colors.
- **Risk:** Visual churn across components.
  - **Mitigation:** update shared tokens/primitives first, then feature surfaces.

## Definition of Done

- App has a coherent, premium visual identity in both light and dark themes.
- 5h and 7d usage lanes are immediately distinguishable.
- Header/account/session/activity hierarchy is visually intentional and easy to scan.
- Accessibility and interaction standards are preserved.
- `pnpm run check:ui`, `pnpm build`, `cargo check`, and `pnpm tauri build --bundles app` pass.
