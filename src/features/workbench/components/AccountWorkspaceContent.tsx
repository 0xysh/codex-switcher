import { useCallback, useMemo, useState } from "react";
import type { ButtonHTMLAttributes } from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { AccountCard } from "../../../components";
import { Button, IconPlus, IconUserCircle } from "../../../components/ui";
import type { AccountWithUsage } from "../../../types";

interface AccountWorkspaceContentProps {
  accounts: AccountWithUsage[];
  loading: boolean;
  error: string | null;
  cardDensityMode: "full" | "compact";
  onOpenAddAccount: () => void;
  onDelete: (accountId: string) => void;
  onRefreshSingleUsage: (accountId: string) => Promise<void>;
  onReconnectAccount: (accountId: string) => Promise<void>;
  onRename: (accountId: string, newName: string) => Promise<void>;
  onReorderAccounts: (accountIds: string[]) => Promise<void>;
}

interface SortableAccountCardProps {
  account: AccountWithUsage;
  canSort: boolean;
  cardDensityMode: "full" | "compact";
  onDelete: (accountId: string) => void;
  onRefreshSingleUsage: (accountId: string) => Promise<void>;
  onReconnectAccount: (accountId: string) => Promise<void>;
  onRename: (accountId: string, newName: string) => Promise<void>;
}

function SortableAccountCard({
  account,
  canSort,
  cardDensityMode,
  onDelete,
  onRefreshSingleUsage,
  onReconnectAccount,
  onRename,
}: SortableAccountCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: account.id,
    disabled: !canSort,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandleProps: ButtonHTMLAttributes<HTMLButtonElement> | undefined = canSort
    ? {
        ...attributes,
        ...listeners,
        "aria-label": `Reorder ${account.name}`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-20 opacity-85" : undefined}>
      <AccountCard
        account={account}
        onDelete={() => onDelete(account.id)}
        onRefresh={() => onRefreshSingleUsage(account.id)}
        onReconnect={() => onReconnectAccount(account.id)}
        onRename={(newName: string) => onRename(account.id, newName)}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        displayMode={cardDensityMode}
      />
    </div>
  );
}

export function AccountWorkspaceContent({
  accounts,
  loading,
  error,
  cardDensityMode,
  onOpenAddAccount,
  onDelete,
  onRefreshSingleUsage,
  onReconnectAccount,
  onRename,
  onReorderAccounts,
}: AccountWorkspaceContentProps) {
  const [pendingOrderIds, setPendingOrderIds] = useState<string[] | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 140,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const accountIdOrder = useMemo(() => accounts.map((account) => account.id), [accounts]);
  const accountById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );

  const orderedIds = useMemo(() => {
    if (!pendingOrderIds) {
      return accountIdOrder;
    }

    if (pendingOrderIds.length !== accountIdOrder.length) {
      return accountIdOrder;
    }

    const idSet = new Set(accountIdOrder);
    const hasSameMembers = pendingOrderIds.every((id) => idSet.has(id));
    return hasSameMembers ? pendingOrderIds : accountIdOrder;
  }, [accountIdOrder, pendingOrderIds]);

  const orderedAccounts = useMemo(
    () => orderedIds.map((id) => accountById.get(id)).filter(Boolean) as AccountWithUsage[],
    [accountById, orderedIds],
  );

  const canSort = orderedAccounts.length > 1 && !isReordering;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!canSort || !over) {
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) {
        return;
      }

      const oldIndex = orderedIds.indexOf(activeId);
      const newIndex = orderedIds.indexOf(overId);

      if (oldIndex < 0 || newIndex < 0) {
        return;
      }

      const nextOrderIds = arrayMove(orderedIds, oldIndex, newIndex);
      setPendingOrderIds(nextOrderIds);
      setIsReordering(true);

      void onReorderAccounts(nextOrderIds)
        .then(() => {
          setPendingOrderIds(null);
        })
        .catch(() => {
          setPendingOrderIds(null);
        })
        .finally(() => {
          setIsReordering(false);
        });
    },
    [canSort, onReorderAccounts, orderedIds],
  );

  if (loading && accounts.length === 0) {
    return (
      <div className="surface-panel reveal-rise p-6">
        <p className="section-title">Accounts Workspace</p>
        <div className="mt-4 space-y-3">
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
          <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-surface)] motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-panel reveal-rise p-6">
        <p className="section-title">Accounts Workspace</p>
        <div className="mt-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          Failed to load accounts: {error}
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="surface-panel reveal-rise p-8 text-center">
        <p className="section-title">Accounts Workspace</p>
        <div className="mx-auto mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-primary)] shadow-[var(--shadow-soft)]">
          <IconUserCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">Start with your first account</h3>
        <p className="mt-2 text-sm text-secondary">Connect a ChatGPT login or import an existing auth.json file.</p>
        <div className="mt-5">
          <Button variant="primary" onClick={onOpenAddAccount}>
            <IconPlus className="h-4 w-4" />
            Add account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="reveal-rise" aria-label="Accounts Workspace">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {orderedAccounts.map((account) => (
              <SortableAccountCard
                key={account.id}
                account={account}
                canSort={canSort}
                cardDensityMode={cardDensityMode}
                onDelete={onDelete}
                onRefreshSingleUsage={onRefreshSingleUsage}
                onReconnectAccount={onReconnectAccount}
                onRename={onRename}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
