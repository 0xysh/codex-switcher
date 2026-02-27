### Incorporated review findings (2026-02-27)
- Reviewer: OpenCode
- [x] Blocker: Added explicit frontend test/bootstrap steps (Vitest + jsdom + Testing Library + Tauri mocks).
- [x] Blocker: Added negative-path coverage requirements (failed async actions, canceled flows, error announcements).
- [x] Blocker: Added rollback/recovery runbook with stop-the-line criteria.
- [x] Blocker: Added compatibility constraints to prevent accidental Rust/Tauri API contract drift.
- [x] Blocker: Replaced placeholder test snippets with executable, type-safe examples.
- [ ] Open risk (non-blocker): Virtualization may be unnecessary for current account counts; keep as conditional Phase 2 after profiling.

# Codex Usage Inspector UI/UX Modernization Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver an accessibility-first, maintainable UI foundation for Codex Usage Inspector with robust tests, clear interaction semantics, and safe incremental rollout.

**Architecture:** Implement a frontend-only modernization in vertical slices: establish test infrastructure, introduce reusable UI primitives/tokens, refactor existing screens for semantics/focus/live-feedback, and lock quality with automated checks. Keep all Tauri invoke contracts and Rust-side payloads unchanged.

**Tech Stack:** React 19, TypeScript strict mode, Tailwind CSS v4, Vitest, React Testing Library, jest-dom, user-event, jest-axe.

---

## Preconditions

- Work only in frontend files unless a compatibility blocker is found.
- Preserve invoke command names used by frontend (`src/hooks/useAccounts.ts`) and exported by backend (`src-tauri/src/lib.rs`).
- Keep existing formatting conventions from `AGENTS.md` (double quotes, semicolons, 2-space indentation).

## Acceptance Criteria (Pass/Fail)

- Accessibility: icon-only controls have labels, forms have associated labels, async status/errors are announced, keyboard-only navigation works.
- Focus and motion: all interactive elements have visible `focus-visible` states; animations honor reduced motion.
- Content quality: loading copy uses typographic ellipsis (`…`), destructive actions remain confirmed, empty/error states remain intact.
- Reliability: UI tests cover success and failure states for refresh/add/delete flows.
- Safety: no changes to Rust command names, no changes to credential storage/security behavior.
- Validation: `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`, `cargo check --manifest-path src-tauri/Cargo.toml` pass.

## Task 0: Baseline, Branch, and Safety Snapshot

**Files:**
- Modify: none

**Step 1: Capture baseline status**

Run: `git status -sb`
Expected: clean working tree before execution.

**Step 2: Verify baseline checks**

Run: `pnpm exec tsc --noEmit && pnpm build && cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS; save outputs in handoff notes.

**Step 3: Create feature branch**

Run: `git checkout -b feat/ui-ux-modernization-foundation`
Expected: branch created from `main`.

**Step 4: Commit**

No commit in this task.

## Task 1: Test Harness + Tauri Mock Layer (Blocking Prerequisite)

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/mocks/tauri.ts`
- Create: `src/test/mocks/useAccounts.ts`
- Create: `src/App.test.tsx`
- Modify: `package.json`

**Step 1: Write the failing test**

```tsx
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

it("renders app title", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Codex Usage Inspector" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/App.test.tsx`
Expected: FAIL (Vitest/config missing).

**Step 3: Write minimal implementation**

```json
// package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:a11y": "vitest run --reporter=verbose"
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    clearMocks: true,
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

Add dev dependencies:

Run: `pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe`

**Step 4: Run test to verify harness passes**

Run: `pnpm test -- src/App.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test/setup.ts src/test/mocks/tauri.ts src/test/mocks/useAccounts.ts src/App.test.tsx
git commit -m "test: add frontend test harness and tauri mocks"
```

## Task 2: Design Tokens + Reusable Accessible Buttons

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/IconButton.tsx`
- Create: `src/components/ui/index.ts`
- Create: `src/components/ui/Button.test.tsx`
- Modify: `src/App.css`

**Step 1: Write the failing test**

```tsx
// src/components/ui/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { IconButton } from "./IconButton";

it("renders icon button with accessible name", () => {
  render(<IconButton aria-label="Refresh Usage">↻</IconButton>);
  expect(screen.getByRole("button", { name: "Refresh Usage" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/ui/Button.test.tsx`
Expected: FAIL (component missing).

**Step 3: Write minimal implementation**

```tsx
// src/components/ui/IconButton.tsx
import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  "aria-label": string;
};

export function IconButton(props: IconButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
      {...props}
    />
  );
}
```

```css
/* src/styles/tokens.css */
:root {
  --surface-bg: #f8fafc;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/ui/Button.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/styles/tokens.css src/App.css src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/ui/index.ts src/components/ui/Button.test.tsx
git commit -m "feat(ui): add shared tokens and accessible button primitives"
```

## Task 3: App Shell Semantics + Global Live Announcements

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Create: `src/components/ui/LiveRegion.tsx`

**Step 1: Write the failing test**

```tsx
it("provides skip link and polite live region", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: /skip to main content/i })).toBeInTheDocument();
  expect(screen.getByRole("status", { name: /global announcements/i })).toHaveAttribute("aria-live", "polite");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/App.test.tsx`
Expected: FAIL (elements missing).

**Step 3: Write minimal implementation**

- Add skip link above header.
- Add `id="main-content"` to `<main>`.
- Replace inline toast-only rendering with a central `LiveRegion` that announces refresh and delete confirmations.
- Update loading copy: `Refreshing...` -> `Refreshing…`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/App.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components/ui/LiveRegion.tsx
git commit -m "fix(a11y): add semantic app shell and live announcements"
```

## Task 4: AddAccountModal Accessibility + Error Semantics

**Files:**
- Modify: `src/components/AddAccountModal.tsx`
- Create: `src/components/__tests__/AddAccountModal.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AddAccountModal } from "../AddAccountModal";

it("has accessible close button and labeled account name input", () => {
  render(
    <AddAccountModal
      isOpen
      onClose={vi.fn()}
      onImportFile={vi.fn(async () => {})}
      onStartOAuth={vi.fn(async () => ({ auth_url: "https://example.com" }))}
      onCompleteOAuth={vi.fn(async () => ({}))}
      onCancelOAuth={vi.fn(async () => {})}
    />
  );
  expect(screen.getByRole("button", { name: /close add account modal/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/account name/i)).toHaveAttribute("name", "accountName");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Add `aria-label` to close icon button.
- Add `id`/`htmlFor`, `name`, `autoComplete="off"` on text field.
- Mark error container as `role="status"` with `aria-live="polite"`.
- Replace `Browse...`, `Adding...`, `Waiting for browser login...` with typographic `…`.
- Add modal scroll containment class (`overscroll-contain`).

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/__tests__/AddAccountModal.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/AddAccountModal.tsx src/components/__tests__/AddAccountModal.test.tsx
git commit -m "fix(a11y): harden add account modal semantics"
```

## Task 5: AccountCard Interaction Semantics + Focus Safety

**Files:**
- Modify: `src/components/AccountCard.tsx`
- Create: `src/components/__tests__/AccountCard.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { AccountCard } from "../AccountCard";

it("exposes labeled icon controls and keyboard-safe rename trigger", () => {
  render(
    <AccountCard
      account={{
        id: "acc-1",
        name: "Work",
        email: "work@example.com",
        plan_type: "plus",
        auth_mode: "chat_gpt",
        is_active: false,
        created_at: new Date().toISOString(),
        last_used_at: null,
      }}
      onSwitch={() => {}}
      onDelete={() => {}}
      onRefresh={async () => {}}
      onRename={async () => {}}
      onToggleMask={() => {}}
    />
  );
  expect(screen.getByRole("button", { name: /rename account/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /remove account/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Replace clickable `<h3 onClick>` with a `<button type="button">` rename trigger.
- Add `aria-label` for eye/refresh/delete icon controls.
- Replace `transition-all` usages with explicit transitions.
- Replace `Switching...` with `Switching…`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/AccountCard.tsx src/components/__tests__/AccountCard.test.tsx
git commit -m "fix(a11y): normalize account card interactions"
```

## Task 6: UsageBar Numeric Readability + Motion Compliance

**Files:**
- Modify: `src/components/UsageBar.tsx`
- Create: `src/components/__tests__/UsageBar.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { UsageBar } from "../UsageBar";

it("renders usage numbers with tabular-nums and composited transitions", () => {
  render(
    <UsageBar
      usage={{
        account_id: "acc-1",
        plan_type: "plus",
        primary_used_percent: 40,
        primary_window_minutes: 300,
        primary_resets_at: Math.floor(Date.now() / 1000) + 3600,
        secondary_used_percent: null,
        secondary_window_minutes: null,
        secondary_resets_at: null,
        has_credits: null,
        unlimited_credits: null,
        credits_balance: null,
        error: null,
      }}
    />
  );
  expect(screen.getByText(/% left/i)).toHaveClass("tabular-nums");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/__tests__/UsageBar.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Add `tabular-nums` to numeric labels.
- Replace `transition-all` with `transition-[width]`.
- Add `motion-reduce:transition-none` for animated bar movement.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/__tests__/UsageBar.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/UsageBar.tsx src/components/__tests__/UsageBar.test.tsx
git commit -m "fix(ui): improve usage bar readability and motion behavior"
```

## Task 7: Persist Non-Sensitive UI Preferences (Masking Only)

**Files:**
- Create: `src/hooks/useUiPreferences.ts`
- Create: `src/hooks/__tests__/useUiPreferences.test.ts`
- Modify: `src/App.tsx`

**Step 1: Write the failing test**

```ts
import { act, renderHook } from "@testing-library/react";
import { useUiPreferences } from "../useUiPreferences";

it("safely persists masked account ids to localStorage", () => {
  const { result } = renderHook(() => useUiPreferences());
  act(() => result.current.setMaskedAccountIds(["acc-1"]));

  expect(localStorage.getItem("codex-switcher:ui")).toContain("acc-1");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/__tests__/useUiPreferences.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Add a small hook storing only `maskedAccountIds` under `codex-switcher:ui`.
- Handle invalid JSON by falling back to defaults.
- Do not persist secrets, emails, tokens, or usage payloads.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/__tests__/useUiPreferences.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useUiPreferences.ts src/hooks/__tests__/useUiPreferences.test.ts src/App.tsx
git commit -m "feat(ui): persist non-sensitive interface preferences"
```

## Task 8: Negative-Path Regression Tests (Required)

**Files:**
- Modify: `src/App.test.tsx`
- Modify/Create: `src/components/__tests__/*.test.tsx`

**Step 1: Write failing negative tests**

- Refresh failure still clears loading UI.
- Cancel OAuth path does not leave pending state stuck.
- Delete confirmation expires after timeout.
- `useUiPreferences` recovers from malformed stored JSON.

**Step 2: Run tests to verify failure**

Run: `pnpm test`
Expected: FAIL on new negative tests.

**Step 3: Implement minimal fixes**

- Add missing state cleanup and announcement logic where required.
- Do not change backend APIs.

**Step 4: Run tests to verify pass**

Run: `pnpm test`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/App.test.tsx src/components/__tests__ src/hooks/__tests__
git commit -m "test: add negative-path coverage for ui flows"
```

## Task 9: Documentation + Quality Gate Commands

**Files:**
- Create: `docs/ui-ux-architecture.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `package.json`

**Step 1: Write failing command expectation**

Run: `pnpm run check:ui`
Expected: FAIL (script missing).

**Step 2: Add quality scripts**

```json
"check:ui": "pnpm exec tsc --noEmit && pnpm test && pnpm build"
```

Document:
- UI primitives and ownership boundaries.
- Accessibility checklist for PR review.
- Single-test usage examples (`pnpm test -- src/path/file.test.tsx`).

**Step 3: Run full validation**

Run: `pnpm run check:ui`
Expected: PASS.

**Step 4: Commit**

```bash
git add package.json README.md AGENTS.md docs/ui-ux-architecture.md
git commit -m "docs(ui): add architecture notes and ui quality gate"
```

## Task 10 (Conditional): List Virtualization Phase 2

**Condition to execute:** only if profiling shows account list rendering >16ms commit time for >=50 cards.

**Files (if condition met):**
- Create: `src/components/AccountGrid.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/__tests__/AccountGrid.test.tsx`

**Step 1: Record profiling evidence**

Run: React Profiler in dev tools with 60+ mock accounts.
Expected: evidence artifact in PR notes.

**Step 2: Implement minimal virtualization**

- Add virtualization only to non-active account list.
- Preserve keyboard order and screen-reader semantics.

**Step 3: Validate**

Run: `pnpm test -- src/components/__tests__/AccountGrid.test.tsx && pnpm build`
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/AccountGrid.tsx src/App.tsx src/components/__tests__/AccountGrid.test.tsx
git commit -m "feat(ui): virtualize account list for large datasets"
```

## Sequence and Dependency Map

- Required order: Task 0 -> Task 1 -> Task 2 -> Task 3/4/5/6/7 -> Task 8 -> Task 9.
- Parallelizable after Task 2: Tasks 4, 5, and 6 can run in parallel with separate subagents.
- Task 10 is optional and runs only after Task 9 and profiling evidence.

## Compatibility and Breaking-Change Guardrails

- Do not rename invoke command strings in `src/hooks/useAccounts.ts`.
- Do not modify Tauri command exports in `src-tauri/src/lib.rs` as part of this plan.
- Do not change credential/keychain behavior in `src-tauri/src/auth/storage.rs` and `src-tauri/src/auth/secret_store.rs`.
- Keep CSP posture unchanged unless explicitly approved (`src-tauri/tauri.conf.json`).

## Rollback and Recovery Runbook

1. Rollback trigger: any stop-the-line criterion hit (below).
2. Revert commits in reverse order from this plan branch:
   - `git log --oneline`
   - `git revert <sha>` for each affected commit.
3. Re-run validation after each revert:
   - `pnpm exec tsc --noEmit`
   - `pnpm build`
   - `cargo check --manifest-path src-tauri/Cargo.toml`
4. Data integrity: no migration is expected; only local UI preference key may be added. If needed, remove `codex-switcher:ui` from localStorage manually.

## Stop-the-Line Criteria (Immediate Halt)

- Any Rust/Tauri API contract drift (invoke mismatch, changed payload shape).
- Any test reveals token/secret leakage into logs/UI snapshots.
- Keyboard navigation is broken for modal close, rename, refresh, delete, or primary add/switch actions.
- Quality gate fails and cannot be resolved without cross-boundary architectural change.

## Final Verification Sequence (Required Before Merge)

1. `pnpm exec tsc --noEmit`
2. `pnpm test`
3. `pnpm build`
4. `cargo check --manifest-path src-tauri/Cargo.toml`
5. Manual smoke run: `pnpm tauri dev` and validate add/switch/delete/refresh flows.

Expected: all pass.

## Skills to Use During Execution

- `@test-driven-development` for every task loop.
- `@web-design-guidelines` for final compliance sweep.
- `@requesting-code-review` before merge.
