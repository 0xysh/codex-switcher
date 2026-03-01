# UI/UX Architecture

This document defines frontend ownership boundaries and quality checks for Codex Usage Inspector UI work.

## Frontend Boundaries

- `src/App.tsx`: composition root only (high-level wiring, global overlays, and feature assembly).
- `src/features/workbench/*`: account workbench feature logic (selectors, hooks, section components).
- `src/hooks/useAccounts.ts`: Tauri `invoke` orchestration for account/usage workflows.
- `src/hooks/useUiPreferences.ts`: non-sensitive local preference state only.
- `src/hooks/useTheme.ts`: theme preference + resolved theme synchronization.
- `src/hooks/useDialogFocusTrap.ts`: shared dialog focus-trap and keyboard containment behavior.
- `src/components/*`: reusable domain components (`AccountCard`, `AddAccountModal`, `UsageBar`, dialogs).
- `src/components/ui/*`: reusable primitives (`Button`, `IconButton`, `LiveRegion`, icon set).
- `src/styles/tokens.css`: global design tokens, theme vars, and reduced-motion defaults.

Do not move command/business logic into presentational components.

## Usage-First Workbench Contract

- Workbench layout is usage-first: header, account workspace, current session card, and recent activity.
- Header Control Rail uses a stable 3x2 interaction surface: Refresh Usage, Add Account, Full/Compact toggle, then Light/Dark/Random theme controls, followed by compact status tiles for Accounts Tracked and Blocking PIDs.
- Random theme control includes an inline `(!)` inspector trigger that opens a modal with the currently active color token set and a one-click copy action.
- `CurrentCodexSessionCard` is the only UI entry point for auth.json session refresh/snapshot actions.
- Account cards are uniform; no active-account special layout and no switch CTA surface.
- Account cards support drag-handle reordering when multiple accounts exist; order is persisted in local account storage.
- Account cards support persistent display density modes: `full` (management controls visible) and `compact` (name, inline refresh icon, drag handle, usage telemetry).
- Inspector/shortcuts/search/quick-switch surfaces are intentionally removed from the primary UI.
- Generic Add Account import defaults to the Codex auth directory (`~/.codex`) when current session metadata is available.
- Current Session `Import Snapshot` refreshes session metadata first, then defaults file picker to snapshots directory.

## Scalability Rules

- Extract reusable behavior into hooks/selectors before duplicating logic.
- Split files when they cross complexity budgets from `docs/engineering-standards.md`.
- Keep section-level UI in feature components, not in `App.tsx`.
- Keep component props explicit and typed; avoid implicit object bags.

## Accessibility Contract

All new/changed UI must satisfy:

- Icon-only controls expose `aria-label`.
- Inputs have associated labels (`htmlFor` + `id`) and meaningful `name` attributes.
- Keyboard interaction works for all controls and destructive actions.
- Full/Compact toggle remains keyboard-accessible and announces mode changes through the global live region.
- Reorder handles remain keyboard focusable and touch-friendly when drag sorting is enabled.
- Dialogs trap focus, close on `Escape`, and restore keyboard-safe navigation.
- Async status/error messages are announced with polite live regions.
- `focus-visible` ring is present on interactive controls.
- Motion respects `prefers-reduced-motion`.
- Copy uses typographic ellipsis (`…`) in loading states.
- Primary session card actions must remain keyboard-accessible and touch-friendly (`>=44px` targets).

## Testing Strategy

- Runner: Vitest (`jsdom`) + Testing Library.
- Setup: `src/test/setup.ts`.
- Tauri mocks: `src/test/mocks/tauri.ts`.
- Hook/component tests: colocate under `src/**/__tests__/`.

### Run Tests

- Full suite: `pnpm test`
- Single test file: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`
- Watch mode: `pnpm test:watch`
- UI quality gate: `pnpm run check:ui`

## PR Checklist (UI-Focused)

- [ ] Behavior change has tests (including at least one negative async path when applicable).
- [ ] No placeholder TODOs, temporary hacks, or hidden feature flags.
- [ ] No duplicated behavioral logic across dialogs/sections.
- [ ] No `transition-all` on newly added UI.
- [ ] No secrets or auth payloads introduced in frontend logs/state persistence.
- [ ] `pnpm run check:ui` passes locally.
