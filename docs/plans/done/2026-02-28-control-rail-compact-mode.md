# Control Rail 3x2 + Full/Compact Cards Implementation Plan

### Incorporated review findings (2026-02-28)
- [x] Blocker: Added explicit backward-compatible localStorage migration criteria for `useUiPreferences` (`maskedAccountIds` must be preserved when `cardDensityMode` is absent).
- [x] Blocker: Added rollback/recovery + stop-the-line criteria with concrete revert behavior for compact-mode regressions.
- [x] Blocker: Removed optional-file commit hazard in Task 3 commit step (`git add -A` for extracted/inline variants).
- [x] Blocker: Added explicit compact-mode behavior contract (refresh-only controls, no rename/reconnect/delete, drag handle only when sortable handle exists).
- [ ] Open risk (non-blocker): Control Rail copy width on very narrow windows may require final wording trim after live visual QA.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a persistent `Full`/`Compact` account-card mode toggle in the Control Rail, keep the Control Rail in a stable 3x2 layout, and render compact account cards for scan-first usage.

**Architecture:** Persist non-sensitive card density preference in `useUiPreferences` (`full`/`compact`) with backward-compatible parsing of existing `codex-switcher:ui` payloads, then pass mode through `App.tsx` into `WorkbenchHeader` and `AccountWorkspaceContent`. Keep business logic and Tauri command contracts unchanged; only presentation and local preferences are updated. Preserve drag sorting behavior in both modes and maintain touch/keyboard accessibility.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest + Testing Library, localStorage persistence, existing Tauri frontend boundary.

---

### Task 1: Persist card density preference (`full`/`compact`)

**Files:**
- Modify: `src/hooks/useUiPreferences.ts`
- Modify: `src/hooks/__tests__/useUiPreferences.test.ts`

**Step 1: Write the failing test**

```ts
it("defaults card density to full and persists compact mode", () => {
  const { result } = renderHook(() => useUiPreferences());

  expect(result.current.cardDensityMode).toBe("full");

  act(() => {
    result.current.setCardDensityMode("compact");
  });

  expect(window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY)).toContain(
    '"cardDensityMode":"compact"',
  );
});

it("preserves masked ids from legacy storage payloads without card density", () => {
  window.localStorage.setItem(
    UI_PREFERENCES_STORAGE_KEY,
    JSON.stringify({ maskedAccountIds: ["acc-legacy"] }),
  );

  const { result } = renderHook(() => useUiPreferences());
  expect(result.current.maskedAccountIds).toEqual(["acc-legacy"]);
  expect(result.current.cardDensityMode).toBe("full");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/hooks/__tests__/useUiPreferences.test.ts`

Expected: FAIL because `cardDensityMode` and `setCardDensityMode` do not exist yet.

**Step 3: Write minimal implementation**

- Extend `UiPreferences` with:

```ts
cardDensityMode: "full" | "compact";
```

- Add safe parser for `cardDensityMode` with fallback to `"full"`.
- Preserve legacy storage compatibility:
  - existing `maskedAccountIds`-only payloads must still load masked ids.
  - malformed/unknown `cardDensityMode` must not break preference load.
- Update persistence shape to include both `maskedAccountIds` and `cardDensityMode`.
- Expose `cardDensityMode` and `setCardDensityMode` from `useUiPreferences`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/hooks/__tests__/useUiPreferences.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useUiPreferences.ts src/hooks/__tests__/useUiPreferences.test.ts
git commit -m "feat(ui): persist account card density preference"
```

---

### Task 2: Add Control Rail `Full/Compact` toggle and enforce 3x2 layout

**Files:**
- Modify: `src/features/workbench/components/WorkbenchHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Step 1: Write the failing test**

```ts
it("renders control rail as three top actions and three theme options", async () => {
  render(<App />);

  expect(await screen.findByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /add account/i })).toBeInTheDocument();
  expect(await screen.findByRole("button", { name: /compact view/i })).toBeInTheDocument();

  expect(await screen.findByRole("radio", { name: /light/i })).toBeInTheDocument();
  expect(await screen.findByRole("radio", { name: /dark/i })).toBeInTheDocument();
  expect(await screen.findByRole("radio", { name: /random/i })).toBeInTheDocument();
});

it("toggles compact/full button label when density mode changes", async () => {
  const user = userEvent.setup();
  render(<App />);

  const compactButton = await screen.findByRole("button", { name: /compact view/i });
  await user.click(compactButton);

  expect(await screen.findByRole("button", { name: /full view/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/App.test.tsx`

Expected: FAIL because the `Compact View` toggle does not exist.

**Step 3: Write minimal implementation**

- In `App.tsx`, read `cardDensityMode` + `setCardDensityMode` from `useUiPreferences`.
- Add toggle handler:

```ts
const toggleCardDensityMode = useCallback(() => {
  setCardDensityMode(cardDensityMode === "full" ? "compact" : "full");
}, [cardDensityMode, setCardDensityMode]);
```

- Extend `WorkbenchHeader` props with `cardDensityMode` and `onToggleCardDensityMode`.
- Update Control Rail structure to a stable 3x2 arrangement:
  - Top row (3 columns): `Refresh Usage`, `Add Account`, `Compact View` / `Full View`.
  - Bottom row (3 columns): `ThemeToggle` radios (`Light`, `Dark`, `Random`) aligned to same visual rhythm.
- Keep top row 3 columns across responsive sizes (no collapse to 2 columns for action row).
- Keep accessibility/touch rules:
  - `min-h-11` targets
  - at least `gap-2`
  - visible focus rings.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/App.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/workbench/components/WorkbenchHeader.tsx src/App.tsx src/App.test.tsx
git commit -m "feat(ui): add control rail full-compact toggle"
```

---

### Task 3: Add compact card rendering mode in `AccountCard`

**Files:**
- Modify: `src/components/AccountCard.tsx`
- Modify: `src/components/__tests__/AccountCard.test.tsx`
- Optional Create (if needed for complexity): `src/components/account-card/AccountCardCompactContent.tsx`

**Step 1: Write the failing test**

```ts
it("renders compact mode with only name, drag, usage, and refresh", () => {
  render(
    <AccountCard
      account={mockAccount}
      displayMode="compact"
      onDelete={async () => {}}
      onRefresh={async () => {}}
      onReconnect={async () => {}}
      onRename={async () => {}}
      dragHandleProps={{ "aria-label": "Reorder Work" }}
    />,
  );

  expect(screen.getByText("Work")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reorder work/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();

  expect(screen.queryByRole("button", { name: /reconnect/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /remove account/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/credits:/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /rename account/i })).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`

Expected: FAIL because `displayMode` is not implemented.

**Step 3: Write minimal implementation**

- Add `displayMode?: "full" | "compact"` prop (default `"full"`).
- Keep existing `full` behavior unchanged.
- Add compact rendering path:
  - show account name (non-editable text)
  - show drag handle when provided by sortable context (same existing `>1 accounts` behavior)
  - show usage block
  - show only `Refresh Usage` button
  - hide metadata row (email/credits), chips row, reconnect, delete.
  - hide rename affordance in compact mode.
- If file grows beyond budget, extract compact JSX to helper component.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/__tests__/AccountCard.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add compact display mode for account cards"
```

---

### Task 4: Propagate display mode through workspace cards while preserving drag-sort

**Files:**
- Modify: `src/features/workbench/components/AccountWorkspaceContent.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Step 1: Write the failing test**

```ts
it("switches to compact mode and hides card management controls", async () => {
  useAccountsMock.mockReturnValue(createUseAccountsMock({ accounts: [mockAccount] }));
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /compact view/i }));

  expect(screen.queryByRole("button", { name: /remove account/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /reconnect/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /refresh usage/i })).toBeInTheDocument();
});

it("keeps reorder handles available in compact mode when multiple accounts exist", async () => {
  useAccountsMock.mockReturnValue(createUseAccountsMock({ accounts: [mockAccountA, mockAccountB] }));
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: /compact view/i }));

  expect(screen.getByRole("button", { name: /reorder work/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /reorder personal/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- src/App.test.tsx`

Expected: FAIL because mode is not passed into account cards yet.

**Step 3: Write minimal implementation**

- Add `cardDensityMode` prop to `AccountWorkspaceContent` and its `SortableAccountCard` bridge.
- Pass `displayMode={cardDensityMode}` to each `AccountCard`.
- Keep sorting sensors and reorder persistence unchanged.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- src/App.test.tsx`

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/workbench/components/AccountWorkspaceContent.tsx src/App.tsx src/App.test.tsx
git commit -m "refactor(workbench): wire compact card mode through workspace"
```

---

### Task 5: Docs alignment and full quality gates

**Files:**
- Modify: `docs/ui-ux-architecture.md`
- Modify: `README.md`

**Step 1: Update docs for new persistent UI mode**

- Add contract note that Control Rail contains mode toggle and theme row.
- Add note that account cards support `full` and `compact` rendering modes.

**Step 2: Run targeted tests first**

Run:
- `pnpm test -- src/hooks/__tests__/useUiPreferences.test.ts src/components/__tests__/AccountCard.test.tsx src/App.test.tsx`

Expected: PASS.

**Step 3: Run full frontend gates**

Run:
- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm run check:ui`

Expected: PASS.

**Step 4: Build app artifact (required workflow)**

Run:
- `pnpm tauri build --bundles app`

Expected: app bundle at `src-tauri/target/release/bundle/macos/Codex Usage Inspector.app`.

**Step 5: Commit**

```bash
git add README.md docs/ui-ux-architecture.md
git commit -m "docs(ui): document control rail density toggle and compact cards"
```

---

## Required Skill References for Execution

- `@superpowers:test-driven-development` for each behavior change.
- `@superpowers:ui-ux-pro-max` to enforce touch target, spacing, and scanability requirements.

## Compatibility and Breaking-Change Notes

- No Rust/Tauri command or payload schema changes are planned.
- No migration of persisted account data files is required (`~/.codex-switcher/accounts.json` unchanged).
- Local UI storage key (`codex-switcher:ui`) must remain backward compatible with existing installs.

## Dependencies and Execution Order

- Task 1 is a hard prerequisite for Tasks 2 and 4 (App wiring depends on persisted density preference API).
- Task 3 must complete before Task 4 can pass integration tests.
- Task 5 runs after all feature tasks; docs and full gates are last.
- Parallelization note: after Task 1, Task 2 and Task 3 may be developed in parallel branches, then merged before Task 4.

## Rollback and Recovery

- **UI rollback path:** revert the header toggle + compact rendering commits and redeploy app build.
- **Preference safety fallback:** if compact mode causes rendering issues, force `cardDensityMode` to `"full"` at load when value is invalid.
- **Manual recovery for local env:** delete `codex-switcher:ui` from localStorage to restore defaults.

### Stop-the-line criteria

- Compact mode hides usage bars or refresh action.
- Compact mode breaks drag-sort behavior when `accounts.length > 1`.
- Control Rail action row loses touch-safe target sizing (`<44px`) on mobile.
- Switching modes causes runtime errors or hydration/render loops.

## Risks and Mitigations

- **Risk:** `AccountCard.tsx` exceeds hard line limit.
  - **Mitigation:** extract compact markup into dedicated helper component file.
- **Risk:** Control Rail label text wraps on small screens.
  - **Mitigation:** concise labels (`Full View`, `Compact View`), enforce `grid-cols-3`, verify at 375px.
- **Risk:** Compact mode accidentally hides critical usage context.
  - **Mitigation:** keep usage bars + reset/% metadata unchanged and test for presence.

## Definition of Done

- Control Rail top actions + theme controls render as intended 3x2 layout.
- Full/Compact mode toggles immediately and persists across app restarts.
- Compact cards show only requested elements: name, drag handle, usage info, refresh.
- Drag sorting continues to work in both modes.
- `pnpm run check:ui` passes and full app build is generated via `pnpm tauri build --bundles app`.
