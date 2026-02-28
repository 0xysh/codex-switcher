# Compact Inline Refresh Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move compact-mode account refresh to a small icon control placed next to the drag handle, removing the large footer refresh button to reduce card footprint.

**Architecture:** Keep full-mode account cards unchanged and only alter compact-mode card composition in `AccountCard`. In compact mode, expose a dedicated icon refresh control in the top-right control cluster (next to reorder when present), preserve async loading/disabled behavior, and remove compact footer action surface. Update tests to assert icon-only compact refresh semantics and app-level behavior.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest + Testing Library, existing UI primitives (`IconButton`, `Button`).

---

### Task 1: Add failing tests for compact inline refresh behavior

**Files:**
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Modify: `src/App.test.tsx`

**Step 1: Write the failing test**

```ts
it("uses icon refresh control in compact mode and removes large footer refresh button", () => {
  render(
    <AccountCard
      account={mockCompactAccount}
      displayMode="compact"
      onDelete={asyncNoop}
      onRefresh={asyncNoop}
      onReconnect={asyncNoop}
      onRename={asyncNoop}
      dragHandleProps={{ "aria-label": "Reorder Compact Account" }}
    />,
  );

  expect(screen.getByRole("button", { name: /refresh compact account usage/i })).toBeInTheDocument();
  expect(screen.queryByText(/refresh usage/i)).not.toBeInTheDocument();
});
```

And app-level expectation update:

```ts
expect(screen.getByRole("button", { name: /refresh work usage/i })).toBeInTheDocument();
expect(screen.getAllByRole("button", { name: /refresh usage/i })).toHaveLength(1);
```

**Step 2: Run test to verify it fails**

Run:
- `pnpm test -- src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`

Expected: FAIL because compact mode still renders the large footer refresh button and does not expose compact inline aria-label behavior.

**Step 3: Commit test baseline**

```bash
git add src/components/__tests__/AccountCard.test.tsx src/App.test.tsx
git commit -m "test(ui): lock compact inline refresh expectations"
```

---

### Task 2: Implement compact inline refresh control in `AccountCard`

**Files:**
- Modify: `src/components/AccountCard.tsx`

**Step 1: Implement minimal behavior to satisfy tests**

- Compact mode only:
  - render a small `IconButton` refresh control in the top-right control cluster.
  - position it next to drag handle when drag handle exists.
  - set deterministic aria label format: `Refresh ${account.name} usage`.
  - keep loading behavior (`animate-spin`) and disabled state while refresh is running.
  - remove compact footer refresh button.
- Full mode remains unchanged (existing footer `Refresh Usage` button stays).

**Step 2: Run targeted tests**

Run:
- `pnpm test -- src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`

Expected: PASS.

**Step 3: Commit implementation**

```bash
git add src/components/AccountCard.tsx
git commit -m "feat(ui): move compact refresh to inline icon control"
```

---

### Task 3: UX/a11y refinement and regression checks

**Files:**
- Modify: `src/components/__tests__/AccountCard.test.tsx` (if additional assertion needed)
- Optional Modify: `src/features/workbench/components/AccountWorkspaceContent.tsx` (only if spacing tune required)

**Step 1: Verify control ergonomics**

- Keep compact top-right controls separated (`gap-2`) and touch-manipulation enabled.
- Ensure focus ring and keyboard interaction remain available via `IconButton` primitive.

**Step 2: Run targeted checks**

Run:
- `pnpm test -- src/components/__tests__/AccountCard.test.tsx`

Expected: PASS with compact mode assertions intact.

**Step 3: Commit if changed**

```bash
git add src/components/__tests__/AccountCard.test.tsx src/features/workbench/components/AccountWorkspaceContent.tsx
git commit -m "refactor(ui): tune compact control spacing and accessibility"
```

---

### Task 4: Documentation and full quality/build gate

**Files:**
- Modify: `docs/ui-ux-architecture.md`
- Modify: `README.md` (if feature phrasing requires compact refresh detail)

**Step 1: Update docs for compact-mode control semantics**

- Clarify compact mode includes inline icon refresh next to drag/reorder controls.

**Step 2: Run full required gates**

Run:
- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm run check:ui`
- `pnpm tauri build --bundles app`

Expected: all PASS; app bundle generated at `src-tauri/target/release/bundle/macos/Codex Usage Inspector.app`.

**Step 3: Commit docs/finalization**

```bash
git add README.md docs/ui-ux-architecture.md
git commit -m "docs(ui): document compact inline refresh control"
```

---

## Risks and Mitigations

- **Risk:** Compact refresh icon too ambiguous.
  - **Mitigation:** explicit aria-label and existing refresh icon motion while loading.
- **Risk:** Loss of obvious refresh affordance in compact mode.
  - **Mitigation:** keep refresh icon visually grouped with drag handle at top-right and preserve loading feedback.
- **Risk:** Footer layout assumptions in tests become stale.
  - **Mitigation:** lock compact-mode tests to icon control semantics and absence of text refresh button.

## Definition of Done

- Compact mode uses small inline icon refresh control near drag handle.
- Compact footer no longer renders large text refresh button.
- Full mode refresh behavior is unchanged.
- App and card tests reflect new compact interaction model.
- Full quality gate and Tauri app build pass.
