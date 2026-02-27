import { useCallback, useMemo, useState } from "react";

interface UiPreferences {
  maskedAccountIds: string[];
}

const STORAGE_KEY = "codex-switcher:ui";

function normalizeMaskedIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function loadPreferences(): UiPreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return { maskedAccountIds: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { maskedAccountIds: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      maskedAccountIds: normalizeMaskedIds(parsed.maskedAccountIds),
    };
  } catch {
    return { maskedAccountIds: [] };
  }
}

function persistPreferences(preferences: UiPreferences) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function useUiPreferences() {
  const [maskedAccountIds, setMaskedAccountIdsState] = useState<string[]>(() => {
    return loadPreferences().maskedAccountIds;
  });

  const setMaskedAccountIds = useCallback((ids: string[]) => {
    const nextIds = normalizeMaskedIds(ids);
    setMaskedAccountIdsState(nextIds);
    persistPreferences({ maskedAccountIds: nextIds });
  }, []);

  const toggleMaskedAccountId = useCallback((accountId: string) => {
    setMaskedAccountIdsState((prev) => {
      const next = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId];
      persistPreferences({ maskedAccountIds: next });
      return next;
    });
  }, []);

  const maskedAccountIdSet = useMemo(() => {
    return new Set(maskedAccountIds);
  }, [maskedAccountIds]);

  return {
    maskedAccountIds,
    maskedAccountIdSet,
    setMaskedAccountIds,
    toggleMaskedAccountId,
  };
}

export { STORAGE_KEY as UI_PREFERENCES_STORAGE_KEY };
