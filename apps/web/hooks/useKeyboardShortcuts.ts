"use client";

import { useEffect, useRef, useCallback } from "react";

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
  // Use ref to always have latest shortcuts without re-attaching listener
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
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
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty deps - listener attached once
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

  // Use refs to avoid re-attaching listeners when callbacks change
  const handlerRef = useRef(handler);
  const enabledRef = useRef(enabled);
  
  handlerRef.current = handler;
  enabledRef.current = enabled;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      const keyMatch = e.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl || meta ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shift === e.shiftKey;
      const altMatch = alt === e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          e.preventDefault();
        }
        handlerRef.current(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, ctrl, meta, shift, alt, preventDefault]); // handler and enabled NOT in deps
}
