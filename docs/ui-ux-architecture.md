# UI/UX Architecture

This document defines frontend ownership boundaries and quality checks for Codex Switcher UI work.

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
- Dialogs trap focus, close on `Escape`, and restore keyboard-safe navigation.
- Async status/error messages are announced with polite live regions.
- `focus-visible` ring is present on interactive controls.
- Motion respects `prefers-reduced-motion`.
- Copy uses typographic ellipsis (`…`) in loading states.

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
