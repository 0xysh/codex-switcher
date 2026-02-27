# Review Appendix - Usage-First UI Simplification

Date: 2026-02-27
Reviewer: OpenCode (gpt-5.3-codex)
Scope: plan validation and architecture review (no implementation in this artifact)

## Repo Understanding Notes

- `AGENTS.md`
- `docs/README.md`
- `docs/engineering-standards.md`
- `docs/ui-ux-architecture.md`
- `src/App.tsx`
- `src/features/workbench/components/*`
- `src/features/workbench/hooks/*`
- `src/features/workbench/selectors.ts`
- `src/features/workbench/types.ts`
- `src/components/AccountCard.tsx`
- `src/components/QuickSwitchDialog.tsx`
- `src/components/__tests__/AddAccountModal.test.tsx`
- `src/components/__tests__/AccountCard.test.tsx`
- `src/components/__tests__/QuickSwitchDialog.test.tsx`
- `src/App.test.tsx`

## Validation findings

### A) Omissions / edge cases covered
- Added explicit requirement to keep `Recent Activity` and PID visibility while removing inspector/shortcuts/switch/search surfaces.
- Added explicit requirement for uniform account card layout (active account no longer special-cased section).
- Added explicit dead-state cleanup in `App.tsx` to avoid stale rerender or orphan handlers.

### B) Over-engineering avoided
- Plan keeps backend invoke contracts stable and limits changes to frontend presentation/orchestration.
- `switchAccount` hook command remains available for compatibility, but UI entry points are removed as requested.

### C) Sequencing
- Test-first simplification.
- Orchestration cleanup before broad component deletion.
- Card unification after switch/search removal to minimize refactor overlap.

### D) Rollback sufficiency
- Rollback strategy defined as commit reverts in reverse task order.
- No schema/data migration involved for this UI pass.

### E) Compatibility risks
- Main compatibility risk is accidental removal of backend command contracts due to dead-code cleanup.
- Mitigation is explicitly captured: keep `useAccounts` contract and invoke command names untouched.

## Sub-agent findings incorporated

- Impact map agent identified exact files and dead states to remove for requested simplification.
- API compatibility agent recommended UI-only deprecation path for switch controls (command retained).
- Test coverage agent provided path-level add/update/delete test checklist now reflected in plan tasks.
