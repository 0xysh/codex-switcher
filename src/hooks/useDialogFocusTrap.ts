import { useEffect, useRef } from "react";
import type { RefObject } from "react";

interface UseDialogFocusTrapOptions {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onRequestClose: () => void;
}

export function useDialogFocusTrap({
  isOpen,
  containerRef,
  onRequestClose,
}: UseDialogFocusTrapOptions) {
  const hasAutoFocusedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAutoFocusedRef.current = false;
      return;
    }

    const dialog = containerRef.current;
    if (!dialog) {
      return;
    }

    const getFocusableElements = () => {
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );

      return elements.filter(
        (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
      );
    };

    if (!hasAutoFocusedRef.current) {
      const focusableElements = getFocusableElements();
      focusableElements[0]?.focus();
      hasAutoFocusedRef.current = true;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onRequestClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [containerRef, isOpen, onRequestClose]);
}
