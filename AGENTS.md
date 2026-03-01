# AGENTS.md

Operational guide for coding agents working in this repository.

Scope: repository-wide unless a deeper `AGENTS.md` overrides this file.

## Project Snapshot

- Stack: Tauri v2, Rust backend, React 19, TypeScript, Vite, Tailwind CSS v4.
- Product: local Codex account/usage manager with snapshot import + reconnect flows.
- Frontend/backend boundary: Tauri `invoke` commands in `src-tauri/src/commands/*`.
- Sensitive local files:
  - `~/.codex-switcher/accounts.json`
  - `~/.codex-switcher/snapshots/*.json`
  - `~/.codex/auth.json` (current session source)

## Rule Precedence (Cursor/Copilot)

- `.cursorrules`: not present.
- `.cursor/rules/`: not present.
- `.github/copilot-instructions.md`: not present.
- If any of the files above are added later, treat them as higher-priority instructions.

## Repository Map

- `src/App.tsx`: composition root and global overlays.
- `src/features/workbench/`: feature selectors/hooks/section components.
- `src/components/`: shared domain components.
- `src/components/ui/`: primitive UI controls/icons.
- `src/hooks/`: reusable stateful logic + Tauri orchestration hooks.
- `src/types/`: TS payload contracts matching Rust serde payloads.
- `src-tauri/src/commands/`: thin command boundary.
- `src-tauri/src/auth/`: local storage, switching, OAuth flow.
- `src-tauri/src/api/`: usage API clients.
- `docs/engineering-standards.md`: complexity + architecture budgets.
- `docs/ui-ux-architecture.md`: frontend ownership and UI contract.

## Setup and Development Commands

- Install dependencies: `pnpm install`
- Frontend dev server: `pnpm dev`
- Tauri dev app: `pnpm tauri dev`
- Frontend production build: `pnpm build`
- Tauri production build: `pnpm tauri build`
- App-only bundle: `pnpm tauri build --bundles app`

Notes:

- Use `pnpm` (not npm/yarn) to match lockfile and scripts.
- `pnpm tauri ...` routes through `scripts/tauri.sh`.

## Lint, Format, and Static Analysis

No ESLint/Prettier config is committed. Use these quality commands:

- TypeScript strict check: `pnpm exec tsc --noEmit`
- UI gate (types + tests + build): `pnpm run check:ui`
- Rust format check: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`
- Rust format apply: `cargo fmt --manifest-path src-tauri/Cargo.toml`
- Rust compile check: `cargo check --manifest-path src-tauri/Cargo.toml`
- Rust clippy (if available): `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`

## Test Commands (Including Single-Test Workflow)

Frontend (Vitest + Testing Library):

- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Single test file (recommended): `pnpm exec vitest run src/App.test.tsx`
- Two explicit files: `pnpm exec vitest run src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`
- Single test by name: `pnpm exec vitest run src/App.test.tsx -t "renders app title"`

Rust tests are present in the repo. Use:

- Run all Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Single Rust test by exact name: `cargo test --manifest-path src-tauri/Cargo.toml test_name -- --exact --nocapture`
- Module/prefix filter: `cargo test --manifest-path src-tauri/Cargo.toml oauth_server::`

## Required Validation Before Handoff

Run this trio unless the user explicitly narrows scope:

1. `pnpm exec tsc --noEmit`
2. `pnpm test -- src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`
3. `pnpm tauri build --bundles app`

If command 2 executes more tests than requested due Vitest resolution behavior, report it clearly.

## TypeScript/React Code Style

- Use functional components and hooks.
- Keep `src/App.tsx` composition-focused; move feature logic into `src/features/*`.
- Prefer explicit interfaces/types for props and domain data.
- Avoid `any`; use unions, generics, and narrowing.
- Use `import type` for type-only imports.
- Formatting: double quotes, semicolons, 2-space indentation.
- Keep Tailwind class patterns consistent with existing tokens/utilities.

Import order:

1. React/runtime imports.
2. Third-party packages.
3. Local imports.
4. Side-effect imports (CSS) last.

Naming conventions:

- Components/types/interfaces: PascalCase.
- Functions/variables/hooks: camelCase.
- Hooks must start with `use`.
- Constants: UPPER_SNAKE_CASE only for true constants.

## Frontend Architecture and Complexity Budgets

- Follow `docs/engineering-standards.md` budgets:
  - Component target <= 220 lines; hard limit 320.
  - Hook/selector target <= 180 lines; hard limit 260.
  - Function target <= 45 lines unless justified.
- If a file exceeds a hard limit, refactor before adding behavior.
- Reuse shared hooks (focus traps, keyboard handling, filtering) instead of duplicating logic.

## Error Handling and Logging

- Catch async UI errors at interaction boundaries.
- Surface actionable messages in UI/live regions when appropriate.
- Keep diagnostic `console.error`, but never log secrets/tokens/raw auth payloads.
- In Rust internals, return `anyhow::Result<T>` with `context/with_context`.
- At command boundary, map errors to `Result<_, String>` via `.map_err(|e| e.to_string())`.

## Rust/Tauri Contract Rules

- Keep command handlers thin in `src-tauri/src/commands/*`.
- Prefer small helpers over monolithic command functions.
- Preserve serde `snake_case` payload fields expected by frontend.
- When Rust payload shapes change, update `src/types/index.ts` in the same change.
- Keep invoke command names synchronized across Rust and frontend callers.

## Security Requirements

- Never commit credentials, tokens, or auth snapshots.
- Preserve restrictive permission logic for local sensitive files.
- Do not relax CSP in `src-tauri/tauri.conf.json` without explicit justification.
- Review logs for token leakage risk when touching auth/API code.

## Docs and Change Management

- Keep `AGENTS.md`, `docs/ui-ux-architecture.md`, and `docs/engineering-standards.md` aligned.
- Update docs with behavior, command, architecture, or security changes.
- Prefer minimal, scoped diffs; avoid unrelated refactors.
- Use conventional commit style (`feat:`, `fix:`, `chore:`) when committing.

## Agent Handoff Checklist

- Relevant checks/tests were run and results are reported.
- Type/contract changes are mirrored across Rust and TypeScript.
- Security-sensitive paths were reviewed for secret leakage.
- Docs were updated if persistent behavior/rules changed.
- No unrelated formatting churn was introduced.
