# Plan Review Appendix — 2026-02-27

Plan: `docs/plans/2026-02-27-ui-ux-modernization-foundation.md`

## Review Metadata

- Reviewer: OpenCode (senior dev protocol)
- Review type: Plan validation only (no product-code implementation)
- Date: 2026-02-27
- Scope: UI/UX modernization plan quality, sequencing, risk, rollback, compatibility

## Repo Understanding Notes

Primary docs and architecture files reviewed before validation:

- `README.md:12` (feature scope and expected app behavior)
- `README.md:47` (security notes and keychain assumptions)
- `AGENTS.md:7` (project topology and module boundaries)
- `AGENTS.md:49` (lint/build quality bars)
- `AGENTS.md:84` (frontend style conventions)
- `AGENTS.md:114` (Rust/Tauri boundary constraints)
- `package.json:7` (existing scripts; no frontend test script present)
- `.github/workflows/build.yml:39` (CI Node/Rust environment)

Relevant modules reviewed end-to-end for workflow/state/trust boundaries:

- `src/App.tsx:8` (main UI state machine)
- `src/hooks/useAccounts.ts:10` (invoke orchestration, loading/error transitions)
- `src/components/AddAccountModal.tsx:48` (add-account interaction boundaries)
- `src/components/AccountCard.tsx:75` (rename/switch/delete controls)
- `src/components/UsageBar.tsx:67` (usage rendering and loading states)
- `src-tauri/src/lib.rs:19` (authoritative command export surface)
- `src-tauri/src/commands/account.rs:53` (switch/delete/rename command contract)
- `src-tauri/src/auth/storage.rs:63` (metadata + keychain migration behavior)
- `src-tauri/src/auth/secret_store.rs:23` (secret-storage trust boundary)
- `src-tauri/tauri.conf.json:22` (CSP posture to preserve)

## Validation Findings (A-E)

### A) Omissions, Edge Cases, Blind Spots

1) **Blocker (fixed): Missing explicit frontend test bootstrap and mock strategy**
- Why this mattered: `App` and hooks call Tauri APIs (`src/App.tsx:46`, `src/hooks/useAccounts.ts:14`), so direct component tests would be brittle/failing without controlled mocks.
- Incorporated in plan: Task 1 adds Vitest/jsdom setup and Tauri mock layer (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:60`).

2) **Blocker (fixed): Missing negative-path acceptance**
- Why this mattered: current UI has async paths that can fail or stall (`src/App.tsx:77`, `src/App.tsx:92`, `src/components/AddAccountModal.tsx:67`).
- Incorporated in plan: Task 8 adds required negative-path regression tests (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:471`).

3) **Blocker (fixed): Missing rollback/stop criteria**
- Why this mattered: prior plan had no executable rollback sequence for partial rollout failures.
- Incorporated in plan: rollback runbook and stop-line criteria (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:586`, `docs/plans/2026-02-27-ui-ux-modernization-foundation.md:598`).

4) **Non-blocker (open): User-language quality checks not automated**
- Example: ellipsis/copy conventions are in scope but not linted automatically.
- Current handling: explicit acceptance criteria and test expectations in tasks.

### B) Over-engineering or Unnecessary Workarounds

1) **Non-blocker (mitigated): Virtualization may be premature**
- Why this mattered: list virtualization adds complexity; no evidence yet of large datasets in normal flow (`src/App.tsx:229`).
- Mitigation: moved to conditional Phase 2, requires profiler evidence first (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:542`).

2) **Non-blocker (fixed): Placeholder snippets were not executable**
- Why this mattered: placeholders increase execution ambiguity and drift.
- Mitigation: replaced with executable snippets and explicit run commands.

### C) Sequence and Dependencies

1) **Blocker (fixed): No explicit prerequisite ordering**
- Why this mattered: UI refactors before test harness would reduce confidence and increase regressions.
- Incorporated in plan:
  - Task 0 baseline/snapshot (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:36`)
  - Task 1 as blocking prerequisite (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:60`)
  - Sequence map with parallelization (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:573`)

2) **Non-blocker: Commit granularity now acceptable**
- Each task ends with isolated commit intent, making bisect/revert practical.

### D) Rollback and Recovery Sufficiency

1) **Blocker (fixed): Rollback mechanics absent**
- Incorporated: reverse-revert runbook with validation steps (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:586`).

2) **Blocker (fixed): No stop-the-line triggers**
- Incorporated: hard halt criteria for API drift, secret leakage, keyboard regression (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:598`).

3) **Data integrity check added**
- Plan explicitly limits persisted UI state to non-sensitive localStorage key and provides cleanup action (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:596`).

### E) Breaking Changes / Compatibility Risks

1) **Blocker (fixed): No explicit compatibility guardrails previously**
- Why this mattered: frontend invoke names must remain aligned with Rust exports (`src/hooks/useAccounts.ts:14`, `src-tauri/src/lib.rs:19`).
- Incorporated: compatibility guardrail section (`docs/plans/2026-02-27-ui-ux-modernization-foundation.md:579`).

2) **Non-blocker (open): Tooling version drift risk**
- Test stack additions may evolve lockfile rapidly; CI should enforce `pnpm install` determinism and full `check:ui` gate.
- Current mitigation: Task 9 adds `check:ui` and final validation sequence.

## Review Conclusion

- Status: **Plan validated and updated to safe-ready**.
- Blockers addressed: yes (test bootstrap/mocks, sequencing, rollback, compatibility, negative paths).
- Remaining open risk: conditional virtualization complexity (non-blocker).

## Recommendations for Execution Session

- Execute strictly task-by-task; do not skip Task 1 or Task 8.
- Keep commits atomic to preserve rollback guarantees.
- Run full verification after each milestone task (3, 6, 9).
- If any stop-the-line criterion is hit, halt and open a focused remediation PR before continuing.
