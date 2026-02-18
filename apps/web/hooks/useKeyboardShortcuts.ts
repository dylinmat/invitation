"use client";

import { useEffect, useCallback } from "react";

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler(e);
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for a single shortcut
export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    preventDefault?: boolean;
    enabled?: boolean;
  }
) {
  const {
    ctrl = false,
    meta = false,
    shift = false,
    alt = false,
    preventDefault = true,
    enabled = true,
  } = options || {};

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl || meta ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shift === e.shiftKey;
      const altMatch = alt === e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          e.preventDefault();
        }
        handler(e);
      }
    },
    [key, handler, ctrl, meta, shift, alt, preventDefault, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
