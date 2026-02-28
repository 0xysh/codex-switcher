import { useCallback, useMemo, useState } from "react";

export type CardDensityMode = "full" | "compact";

interface UiPreferences {
  maskedAccountIds: string[];
  cardDensityMode: CardDensityMode;
}

const STORAGE_KEY = "codex-switcher:ui";

function normalizeMaskedIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeCardDensityMode(value: unknown): CardDensityMode {
  return value === "compact" ? "compact" : "full";
}

function loadPreferences(): UiPreferences {
  if (typeof window === "undefined" || !window.localStorage) {
    return { maskedAccountIds: [], cardDensityMode: "full" };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { maskedAccountIds: [], cardDensityMode: "full" };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      maskedAccountIds: normalizeMaskedIds(parsed.maskedAccountIds),
      cardDensityMode: normalizeCardDensityMode(parsed.cardDensityMode),
    };
  } catch {
    return { maskedAccountIds: [], cardDensityMode: "full" };
  }
}

function persistPreferences(preferences: UiPreferences) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function useUiPreferences() {
  const [preferences, setPreferencesState] = useState<UiPreferences>(() => loadPreferences());

  const updatePreferences = useCallback((updater: (prev: UiPreferences) => UiPreferences) => {
    setPreferencesState((prev) => {
      const next = updater(prev);
      persistPreferences(next);
      return next;
    });
  }, []);

  const setMaskedAccountIds = useCallback((ids: string[]) => {
    const nextIds = normalizeMaskedIds(ids);
    updatePreferences((prev) => ({ ...prev, maskedAccountIds: nextIds }));
  }, [updatePreferences]);

  const toggleMaskedAccountId = useCallback((accountId: string) => {
    updatePreferences((prev) => {
      const nextIds = prev.maskedAccountIds.includes(accountId)
        ? prev.maskedAccountIds.filter((id) => id !== accountId)
        : [...prev.maskedAccountIds, accountId];
      return { ...prev, maskedAccountIds: nextIds };
    });
  }, [updatePreferences]);

  const setCardDensityMode = useCallback((mode: CardDensityMode) => {
    const normalizedMode = normalizeCardDensityMode(mode);
    updatePreferences((prev) => ({ ...prev, cardDensityMode: normalizedMode }));
  }, [updatePreferences]);

  const maskedAccountIdSet = useMemo(() => {
    return new Set(preferences.maskedAccountIds);
  }, [preferences.maskedAccountIds]);

  return {
    maskedAccountIds: preferences.maskedAccountIds,
    maskedAccountIdSet,
    setMaskedAccountIds,
    toggleMaskedAccountId,
    cardDensityMode: preferences.cardDensityMode,
    setCardDensityMode,
  };
}

export { STORAGE_KEY as UI_PREFERENCES_STORAGE_KEY };
