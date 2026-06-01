// =============================================================================
// useKeyboardShortcuts — Keyboard event handler for the editor
// =============================================================================

import { useEffect, useCallback } from 'react';

type ShortcutMap = Record<string, () => void>;

/**
 * Register keyboard shortcuts. Only active when no input/textarea is focused.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key;
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
