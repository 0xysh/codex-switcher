import { useEffect } from "react";
import type { RefObject } from "react";

interface UseWorkbenchHotkeysOptions {
  isQuickSwitchOpen: boolean;
  onOpenQuickSwitch: () => void;
  onCloseQuickSwitch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useWorkbenchHotkeys({
  isQuickSwitchOpen,
  onOpenQuickSwitch,
  onCloseQuickSwitch,
  searchInputRef,
}: UseWorkbenchHotkeysOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputLike =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenQuickSwitch();
        return;
      }

      if (!isInputLike && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === "Escape" && isQuickSwitchOpen) {
        onCloseQuickSwitch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isQuickSwitchOpen, onCloseQuickSwitch, onOpenQuickSwitch, searchInputRef]);
}
