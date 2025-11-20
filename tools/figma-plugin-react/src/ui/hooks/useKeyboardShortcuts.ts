import { useEffect } from 'react';

export type KeyboardShortcut = string; // e.g., 'cmd+n', 'ctrl+f', 'escape'

export interface KeyboardShortcuts {
  [key: string]: () => void;
}

/**
 * Hook to handle keyboard shortcuts
 *
 * @param shortcuts - Object mapping shortcut strings to callback functions
 *
 * @example
 * useKeyboardShortcuts({
 *   'cmd+n': () => handleNewToken(),
 *   'cmd+f': () => handleFindReplace(),
 *   'escape': () => handleClose(),
 * });
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? 'cmd' : 'ctrl';

      let key = event.key.toLowerCase();

      // Normalize special keys
      if (key === 'escape') {
        key = 'escape';
      }

      // Build shortcut string
      const parts: string[] = [];

      // Add modifiers in consistent order
      if (event.ctrlKey || event.metaKey) {
        parts.push(modKey);
      }
      if (event.shiftKey) {
        parts.push('shift');
      }
      if (event.altKey) {
        parts.push('alt');
      }

      // Add the main key
      parts.push(key);

      const shortcut = parts.join('+');

      // Check if this shortcut has a handler
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
