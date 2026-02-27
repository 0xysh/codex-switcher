# Luxe Workbench Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a premium, modern, and highly scannable visual refresh for the Codex Usage Inspector UI without changing product behavior.

**Architecture:** Re-theme the app with token-first styling in `src/styles/tokens.css`, then update shared UI primitives (`Button`, `IconButton`, `ThemeToggle`) and high-traffic surfaces (header, account cards, usage meter, session card, activity panel). Keep all Tauri command flows, hooks, and business logic unchanged while improving hierarchy, density, and interaction feedback.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS variables, Vitest + Testing Library, Tauri v2.

---

### Task 1: Lock UI behavior baselines before restyling

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Modify: `src/components/__tests__/UsageBar.test.tsx`

**Step 1: Add/adjust characterization assertions for layout-critical semantics**
- Ensure app shell still renders: header title, account workspace, current session card, recent activity.
- Ensure account card still renders: rename button, refresh button, reconnect behavior, remove button, `Updated ...` chip.
- Ensure usage bars still render: distinct `5h limit` and `Weekly limit` labels when both metrics exist.

**Step 2: Run targeted tests**
- Run: `pnpm test -- src/App.test.tsx src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx`
- Expected: PASS with no behavior regressions.

**Step 3: Commit test baselines**
- Run:
  - `git add src/App.test.tsx src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx`
  - `git commit -m "test(ui): lock behavior before luxe visual refresh"`

---

### Task 2: Rebuild global visual tokens and atmosphere

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/App.css`
- Modify: `index.html`

**Step 1: Implement refreshed color and surface token system**
- Add premium canvas/surface palette for both light and dark themes.
- Keep semantic status tokens (`success`, `warning`, `danger`) and usage-lane tokens (`--usage-5h`, `--usage-7d`).
- Add atmospheric tokens for mesh glow and soft panel edge lighting.

**Step 2: Upgrade typography and environmental polish**
- Replace base font pairing with a more distinctive display/body stack.
- Improve body/canvas atmosphere using layered gradients and subtle pattern overlays.
- Preserve reduced-motion behavior and visible focus treatment.

**Step 3: Validate compile/build**
- Run:
  - `pnpm exec tsc --noEmit`
  - `pnpm build`

**Step 4: Commit token foundation**
- Run:
  - `git add src/styles/tokens.css src/App.css index.html`
  - `git commit -m "feat(ui): introduce luxe token system and atmospheric shell"`

---

### Task 3: Redesign workbench shell hierarchy and scan paths

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/workbench/components/WorkbenchHeader.tsx`
- Modify: `src/features/workbench/components/AccountWorkspaceContent.tsx`
- Modify: `src/features/workbench/components/InspectorSidebar.tsx`

**Step 1: Refine app shell composition for readability**
- Introduce clearer section spacing and responsive two-column rhythm on large screens.
- Keep existing section order and interactions intact.

**Step 2: Rebuild header visual hierarchy**
- Make title/subtitle/actions visually intentional with stronger card grouping.
- Preserve process status language and existing control labels.
- Keep all controls keyboard/touch friendly (>=44px target).

**Step 3: Improve account workspace + activity scanability**
- Add explicit workspace heading and supportive microcopy.
- Rework recent activity list styling for faster triage.

**Step 4: Validate**
- Run:
  - `pnpm test -- src/App.test.tsx`
  - `pnpm build`

**Step 5: Commit**
- Run:
  - `git add src/App.tsx src/features/workbench/components/WorkbenchHeader.tsx src/features/workbench/components/AccountWorkspaceContent.tsx src/features/workbench/components/InspectorSidebar.tsx`
  - `git commit -m "refactor(ui): improve workbench hierarchy and scanability"`

---

### Task 4: Elevate card-level UX and usage telemetry clarity

**Files:**
- Modify: `src/components/AccountCard.tsx`
- Modify: `src/components/UsageBar.tsx`
- Modify: `src/features/workbench/components/CurrentCodexSessionCard.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Modify: `src/components/__tests__/UsageBar.test.tsx`
- Modify: `src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`

**Step 1: Account card premium retouch**
- Improve chip grouping, card edge definition, and action footer rhythm.
- Keep rename flow, reconnect behavior, and delete behavior unchanged.

**Step 2: Usage lane differentiation**
- Preserve semantic urgency thresholds.
- Increase visual distinction between 5h and weekly lanes using lane-specific accents.
- Keep reset text subordinate and right-aligned.

**Step 3: Session card polish**
- Keep session metadata and actions, but improve visual hierarchy and scannability.

**Step 4: Validate tests/build**
- Run:
  - `pnpm test -- src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`
  - `pnpm build`

**Step 5: Commit**
- Run:
  - `git add src/components/AccountCard.tsx src/components/UsageBar.tsx src/features/workbench/components/CurrentCodexSessionCard.tsx src/components/__tests__/AccountCard.test.tsx src/components/__tests__/UsageBar.test.tsx src/features/workbench/components/__tests__/CurrentCodexSessionCard.test.tsx`
  - `git commit -m "feat(ui): retouch cards and telemetry surfaces for premium clarity"`

---

### Task 5: Unify controls and complete quality gate

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/IconButton.tsx`
- Modify: `src/components/ui/ThemeToggle.tsx`
- Optional Modify (if required for visual parity): `src/components/add-account/AuthMethodTabs.tsx`, `src/components/add-account/OAuthFlowPanel.tsx`, `src/components/add-account/ImportCredentialsPanel.tsx`, `src/components/add-account/AccountNameField.tsx`

**Step 1: Standardize interactive language**
- Unify button depth, border handling, and hover/focus states.
- Keep contrast and accessibility in both themes.

**Step 2: Validate UI gates**
- Run:
  - `pnpm run check:ui`
  - `pnpm exec tsc --noEmit`
  - `pnpm test`
  - `pnpm build`

**Step 3: Document and commit**
- If architecture/workflow rules changed, update docs accordingly.
- Run:
  - `git add -A`
  - `git commit -m "chore(ui): finalize luxe visual refresh quality pass"`

---

## Risks and Mitigations

- **Risk:** Visual refresh reduces readability in one theme.
  - **Mitigation:** preserve strong text contrast, test both light/dark for each updated surface.
- **Risk:** Styling changes unintentionally alter behavior semantics.
  - **Mitigation:** lock and run characterization tests before/after styling tasks.
- **Risk:** Over-animated UI hurts usability.
  - **Mitigation:** use limited staged entrance animation and respect `prefers-reduced-motion`.

## Definition of Done

- Distinctive premium visual identity is applied consistently across shell, cards, and controls.
- Account management and session workflows remain behavior-identical.
- 5h vs weekly usage lanes are easy to distinguish at a glance.
- Accessibility requirements (labels, focus, keyboard, reduced motion) remain intact.
- `pnpm run check:ui`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm build` pass.
