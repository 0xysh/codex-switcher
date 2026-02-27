# Engineering Standards

This document is the implementation baseline for maintainability, scalability, and predictable reviews.

## 1) Architecture Principles

- Keep the codebase layered: command boundary -> domain logic -> UI composition -> UI presentation.
- Preserve Tauri command contracts and frontend type parity (`snake_case` fields, invoke names, payload shapes).
- Prefer composition over monoliths: split by responsibility, not by arbitrary file length alone.
- Reuse behavior through hooks/utilities; do not copy interaction logic across components.

## 2) Frontend Structure Contract

- `src/App.tsx`: composition root and top-level orchestration only.
- `src/features/*`: feature modules that own selectors, hooks, and section components.
- `src/components/*`: reusable domain components shared across features.
- `src/components/ui/*`: low-level visual primitives only (buttons, icons, live regions).
- `src/hooks/*`: cross-feature hooks and app-wide utilities.
- `src/types/*`: Rust-contract-aligned TypeScript models.

## 3) Complexity Budgets

These are strict defaults unless a documented exception is added in the PR description.

- Component file: target <= 220 lines, hard limit 320 lines.
- Hook/selector file: target <= 180 lines, hard limit 260 lines.
- Single function: target <= 45 lines; extract helpers when behavior branches repeatedly.
- `useState` count in one component: if > 8 states, evaluate extracting a dedicated hook.

## 4) Refactor Triggers (Mandatory)

Refactor before adding new behavior when any trigger is met:

- A file crosses its hard limit.
- A component owns both orchestration and large presentational markup.
- The same behavioral logic appears in more than one file (for example focus trap, filtering, keyboard routing).
- A test change requires touching unrelated UI blocks due to tight coupling.

## 5) Testing and Safety Baseline

- Follow red -> green -> refactor for behavior changes and refactors.
- Add or update characterization tests before large internal refactors.
- Required local gates for UI-impacting changes:
  - `pnpm exec tsc --noEmit`
  - `pnpm test`
  - `pnpm run check:ui`
- Required local gate for backend-impacting changes:
  - `cargo check --manifest-path src-tauri/Cargo.toml`

## 6) Documentation Governance

- Update docs in the same PR when architecture, workflows, or quality gates change.
- Keep `docs/README.md` as the canonical docs index.
- Keep `AGENTS.md` aligned with architectural rules used by automation.
- New standards must include:
  - explicit scope,
  - enforcement points (where reviewed),
  - migration guidance for existing files.

## 7) AI-Agent Working Rules

- Prefer incremental, reviewable refactors over large rewrites.
- Maintain backward-compatible module APIs during extraction.
- Do not mix unrelated visual redesign changes with structural refactors.
- Preserve existing accessibility semantics when moving markup.
- Record exact validation commands and outcomes in handoff notes.
