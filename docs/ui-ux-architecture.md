# UI/UX Architecture

This document defines frontend ownership boundaries and quality checks for Codex Switcher UI work.

## Frontend Boundaries

- `src/App.tsx`: app shell, high-level state wiring, global announcements, page sections.
- `src/hooks/useAccounts.ts`: all Tauri `invoke` orchestration for account/usage workflows.
- `src/hooks/useUiPreferences.ts`: non-sensitive local preference state only.
- `src/components/`: feature components (`AccountCard`, `AddAccountModal`, `UsageBar`).
- `src/components/ui/`: reusable primitives (`Button`, `IconButton`, `LiveRegion`).
- `src/styles/tokens.css`: global UI tokens and reduced-motion safety defaults.

Do not move command/business logic into presentational components.

## Accessibility Contract

All new/changed UI must satisfy:

- Icon-only controls expose `aria-label`.
- Inputs have associated labels (`htmlFor` + `id`) and meaningful `name` attributes.
- Keyboard interaction works for all controls and destructive actions.
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

- [ ] Behavior change has tests (including at least one negative path when async).
- [ ] No placeholder TODOs, no temporary hacks.
- [ ] No `transition-all` on newly added UI.
- [ ] No secrets or auth payloads introduced in frontend logs/state persistence.
- [ ] `pnpm run check:ui` passes locally.
