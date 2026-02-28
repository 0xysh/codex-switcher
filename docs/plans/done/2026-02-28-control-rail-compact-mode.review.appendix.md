# Review Appendix: 2026-02-28 Control Rail Compact Mode

## Review Metadata
- Plan reviewed: `docs/plans/2026-02-28-control-rail-compact-mode.md`
- Review date: 2026-02-28
- Reviewer: OpenCode (gpt-5.3-codex)
- Scope: Plan validation only (no feature implementation)

## Repo Understanding Notes
- Repository/agent standards and required checks reviewed in `AGENTS.md`.
- Product behavior and release/build workflow reviewed in `README.md`.
- Documentation governance reviewed in `docs/README.md`.
- Frontend boundary and accessibility contract reviewed in `docs/ui-ux-architecture.md`.
- Complexity budgets and sequencing expectations reviewed in `docs/engineering-standards.md`.
- Relevant implementation paths reviewed end-to-end:
  - composition/orchestration: `src/App.tsx`
  - header/control rail: `src/features/workbench/components/WorkbenchHeader.tsx`
  - sortable card workspace: `src/features/workbench/components/AccountWorkspaceContent.tsx`
  - card surface behavior: `src/components/AccountCard.tsx`
  - theme row behavior: `src/components/ui/ThemeToggle.tsx`
  - current UI preference persistence: `src/hooks/useUiPreferences.ts`
  - integration test baselines: `src/App.test.tsx`, `src/components/__tests__/AccountCard.test.tsx`, `src/hooks/__tests__/useUiPreferences.test.ts`

## A) Omissions, Edge Cases, Blind Spots

### Finding A1 (Blocker)
- Original plan did not explicitly guarantee backward compatibility for existing `codex-switcher:ui` payloads that only contain `maskedAccountIds`.
- Risk: existing users could lose persisted masked preferences or hit parser regressions.
- Evidence: current parser in `src/hooks/useUiPreferences.ts` only normalizes `maskedAccountIds` and would require extension for `cardDensityMode`.
- Disposition: fixed in plan (Task 1 now includes legacy payload preservation + malformed value fallback tests).

### Finding A2 (Blocker)
- Original plan did not explicitly define compact mode behavior boundaries (rename/reconnect/delete hidden, drag handle behavior when sortable).
- Risk: inconsistent implementation and acceptance ambiguity.
- Evidence: current card supports full management controls in `src/components/AccountCard.tsx` and sortable handle originates in `src/features/workbench/components/AccountWorkspaceContent.tsx`.
- Disposition: fixed in plan (Task 3 behavior contract clarified; drag handle condition defined).

### Finding A3 (Non-blocker)
- Responsive copy fit risk for `Compact View`/`Full View` labels on very narrow widths.
- Disposition: recorded as open non-blocker; final visual QA required.

## B) Over-Engineering / Unnecessary Workarounds

### Finding B1
- No extra framework or dependency is required for this feature; plan appropriately reuses existing components and hook structure.
- Recommendation: keep `ThemeToggle` unchanged as the lower row to avoid bespoke duplicated controls.
- Evidence: existing 3-option radios already implemented in `src/components/ui/ThemeToggle.tsx`.
- Disposition: accepted; no blocker.

## C) Sequence and Dependencies

### Finding C1 (Blocker)
- Original plan implied ordering but did not state hard prerequisites clearly.
- Risk: implementing workspace propagation before preference API causes churn/rework.
- Evidence: `App.tsx` is the wiring hub and depends on `useUiPreferences` API shape.
- Disposition: fixed in plan with explicit dependency section:
  - Task 1 prerequisite for Tasks 2/4
  - Task 3 prerequisite for Task 4
  - Task 5 finalization only.

## D) Rollback and Recovery Sufficiency

### Finding D1 (Blocker)
- Original plan lacked explicit rollback/recovery and stop-the-line criteria.
- Risk: unclear operational response if compact mode regresses critical usage workflows.
- Disposition: fixed in plan with rollback section and stop-the-line criteria tied to usage bars, refresh availability, drag sort continuity, and mobile touch-target integrity.

## E) Breaking Changes / Compatibility Risks

### Finding E1
- No backend command/schema compatibility risk identified; this is frontend preference + presentation.
- Potential compatibility surface is localStorage schema evolution only.
- Evidence:
  - No Tauri command changes needed for this feature path (`src/App.tsx`, `src/features/workbench/components/*`).
  - Existing local preference key already in use: `src/hooks/useUiPreferences.ts`.
- Disposition: plan now explicitly marks no Rust/Tauri breaking changes and adds localStorage compatibility requirement.

## Plan Edits Applied During Review
- Added authoritative review header to plan with blocker checklist and open non-blocker risk.
- Strengthened Task 1 with legacy/malformed storage test coverage and migration-safe parsing requirements.
- Added explicit toggle-label behavior test in Task 2.
- Clarified compact-mode scope in Task 3 and removed optional-file commit hazard.
- Added compact-mode reorder-handle integration test in Task 4.
- Added compatibility, dependency ordering, rollback/recovery, and stop-the-line sections.

## Remaining Open Risks
- Non-blocker: exact Control Rail button wording may need final truncation strategy after live 375px QA.
