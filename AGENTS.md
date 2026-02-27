# AGENTS.md

Operational guide for coding agents working in this repository.

Scope: whole repository unless a deeper AGENTS.md is added later.

## Project Overview

- Stack: Tauri v2 + Rust backend + React 19 + TypeScript + Vite + Tailwind CSS v4.
- Purpose: manage multiple Codex accounts and switch the active `~/.codex/auth.json`.
- Frontend talks to backend through Tauri `invoke` commands.
- Backend stores account metadata in `~/.codex-switcher/accounts.json`.
- Credentials are stored locally in `~/.codex-switcher/accounts.json`.

## Repository Map

- `src/`: React frontend.
- `src/features/`: feature-scoped selectors/hooks/section components.
- `src/components/`: UI components.
- `src/hooks/`: stateful hooks and Tauri interaction wrappers.
- `src/types/`: frontend types matching Rust serde payloads.
- `src-tauri/src/`: Rust backend.
- `src-tauri/src/commands/`: Tauri command handlers (frontend boundary).
- `src-tauri/src/auth/`: account storage, switching, and OAuth logic.
- `src-tauri/src/api/`: remote usage API client code.
- `.github/workflows/build.yml`: CI/release pipeline reference.
- `docs/README.md`: documentation index and update policy.
- `docs/engineering-standards.md`: architecture and maintainability standards.

## Cursor / Copilot Rules

- No `.cursorrules` file exists.
- No `.cursor/rules/` directory exists.
- No `.github/copilot-instructions.md` file exists.
- If any of these are added later, treat them as higher-priority repo rules.
- Keep this file aligned with new rule files when they appear.

## Setup Commands

- Install JS deps: `pnpm install`
- Run frontend only: `pnpm dev`
- Run Tauri app (dev): `pnpm tauri dev`
- Build frontend: `pnpm build`
- Build Tauri bundles: `pnpm tauri build`

Notes:

- `pnpm tauri ...` goes through `scripts/tauri.sh` to ensure `cargo` is available.
- CI uses Node 20 and Rust stable.
- On Ubuntu, building requires `libwebkit2gtk-4.1-dev` and related packages.

## Lint / Format / Static Analysis

There is no dedicated ESLint or Prettier config in this repo.
Use the following checks before committing:

- TypeScript strict check: `pnpm exec tsc --noEmit`
- Frontend build check: `pnpm build`
- Frontend quality gate: `pnpm run check:ui`
- Rust format check: `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`
- Rust formatter apply: `cargo fmt --manifest-path src-tauri/Cargo.toml`
- Rust compile check: `cargo check --manifest-path src-tauri/Cargo.toml`
- Rust lint (if installed): `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`

Security/dependency checks:

- JS deps audit: `pnpm audit`
- JS prod deps audit: `pnpm audit --prod`

## Test Commands

Current status:

- Frontend test runner is configured with Vitest + Testing Library.
- No Rust tests are currently present in the codebase.

Frontend tests:

- Run all frontend tests: `pnpm test`
- Run frontend tests in watch mode: `pnpm test:watch`
- Run a single frontend test file: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`

Still, use standard Rust commands when adding tests:

- Run all Rust tests: `cargo test --manifest-path src-tauri/Cargo.toml`
- Run a single Rust test by name: `cargo test --manifest-path src-tauri/Cargo.toml test_name -- --exact --nocapture`
- Run tests matching a module/prefix: `cargo test --manifest-path src-tauri/Cargo.toml oauth_server::`

Single-test guidance:

- Prefer `-- --exact --nocapture` when targeting one named test.
- Keep test names stable and descriptive to make filtering easy.

## TypeScript / React Style

- Use functional components and hooks.
- Keep components focused; move stateful logic into hooks when reusable.
- Use explicit interfaces/types for props and domain models.
- Avoid `any`; prefer narrow unions and `null`/`undefined` handling.
- Use `import type` for type-only imports.
- Maintain existing formatting style: double quotes, semicolons, 2-space indentation.
- Keep Tailwind class usage consistent with existing utility-first approach.

## Frontend Scalability Standards

- Treat `src/App.tsx` as composition root only. It should wire feature modules, not own large section markup and business rules.
- Place feature-specific orchestration in `src/features/<feature>/` as:
  - `selectors.ts` for pure derivations,
  - `hooks/` for stateful/reusable behavior,
  - `components/` for section UI.
- Reuse shared behavior through hooks (for example dialog focus trap, hotkeys, filtering). Do not duplicate behavioral logic across components.
- Follow complexity budgets from `docs/engineering-standards.md`:
  - Component file target <= 220 lines, hard limit 320.
  - Hook/selector file target <= 180 lines, hard limit 260.
  - Function target <= 45 lines unless a clear justification is documented.
- If a file exceeds a hard limit, refactor before adding more behavior.
- Keep extraction refactors behavior-preserving and covered by tests.

Import ordering convention:

1. React/runtime imports.
2. Third-party packages.
3. Local modules.
4. Side-effect imports (for example CSS) last.

Naming conventions:

- Components/interfaces/types: PascalCase.
- Variables/functions/hooks: camelCase.
- Hook names must start with `use`.
- Constants: UPPER_SNAKE_CASE only when truly constant/shared.

Frontend error handling:

- Catch async UI errors at interaction boundaries.
- Show actionable user-facing messages where appropriate.
- Keep `console.error` for diagnostics, but avoid secret/token data.

## Rust / Tauri Style

- Keep Tauri boundary in `src-tauri/src/commands/*` thin.
- Internal modules should return `anyhow::Result<T>` with rich context.
- Tauri command functions should return `Result<_, String>`.
- Convert internal errors at command boundary via `.map_err(|e| e.to_string())`.
- Add context using `context` / `with_context` for IO/network operations.
- Prefer small, focused helper functions over monolithic command handlers.
- Maintain rustfmt defaults; do not hand-format against rustfmt.

Rust naming conventions:

- Modules/functions/variables: snake_case.
- Structs/enums/traits: PascalCase.
- Constants: UPPER_SNAKE_CASE.

Backend API contract rules:

- Preserve serde field naming expected by frontend (`snake_case` payloads).
- If backend payload shape changes, update `src/types/index.ts` in same change.
- Keep frontend `invoke` command names in sync with `#[tauri::command]` exports.

## Security Requirements

- Never store credentials in repository files.
- Store runtime credentials only in local user config (`~/.codex-switcher/accounts.json`).
- Preserve restrictive file permissions logic for local credential files.
- Never log tokens, API keys, refresh tokens, or full auth JSON contents.
- Keep restrictive CSP in `src-tauri/tauri.conf.json`; do not loosen without justification.
- Preserve restrictive file permissions logic for sensitive local files.

## Change and Review Expectations

- Make minimal, scoped changes that follow existing module boundaries.
- Update docs when behavior, commands, security posture, or architecture rules change.
- Run relevant checks locally before handing off.
- Include exact commands run and outcomes in your handoff summary.
- Follow existing commit style (conventional prefix like `fix:`, `feat:`, `chore:`).

## Documentation Governance

- Use `docs/README.md` as the canonical docs index.
- Keep `AGENTS.md`, `docs/ui-ux-architecture.md`, and `docs/engineering-standards.md` aligned.
- When introducing a new persistent workflow or architectural rule, update all affected docs in the same change.
- Prefer short, enforceable rules over broad guidance; include exact paths and commands whenever possible.

## Agent Handoff Checklist

- Code builds (`pnpm build` and/or `cargo check`) for touched areas.
- Any new command is documented here and/or in `README.md`.
- Architecture-impacting changes are documented in `docs/engineering-standards.md` and `docs/ui-ux-architecture.md`.
- Type changes are mirrored across Rust and TypeScript boundaries.
- Security-sensitive paths were reviewed for token leakage.
- No unrelated refactors or formatting churn in untouched modules.
