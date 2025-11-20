import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { undo, redo, selectCanUndo, selectCanRedo } from '../store/slices/historySlice';
import { setTokens } from '../store/slices/tokensSlice';
import { addToast } from '../store/slices/toastsSlice';

/**
 * Custom hook for history operations (undo/redo)
 *
 * Provides methods to undo and redo token changes, along with
 * state flags indicating whether these operations are available.
 *
 * @example
 * const { handleUndo, handleRedo, canUndo, canRedo } = useHistory();
 *
 * useKeyboardShortcuts({
 *   'cmd+z': handleUndo,
 *   'cmd+shift+z': handleRedo,
 * });
 */
export function useHistory() {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  /**
   * Undo the last action
   */
  const handleUndo = useCallback(() => {
    if (!canUndo) return;

    // Dispatch undo action
    dispatch(undo());

    // Get the restored state
    // Note: This is a workaround. In production, we'd use a selector
    // or middleware to sync history state with tokens state
    setTimeout(() => {
      const state = (window as any).store?.getState();
      if (state?.history?.present) {
        dispatch(setTokens(state.history.present.tokens));
        dispatch(
          addToast({
            message: 'Undone',
            type: 'info',
            duration: 2000,
          })
        );
      }
    }, 0);
  }, [canUndo, dispatch]);

  /**
   * Redo the last undone action
   */
  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    // Dispatch redo action
    dispatch(redo());

    // Get the restored state
    setTimeout(() => {
      const state = (window as any).store?.getState();
      if (state?.history?.present) {
        dispatch(setTokens(state.history.present.tokens));
        dispatch(
          addToast({
            message: 'Redone',
            type: 'info',
            duration: 2000,
          })
        );
      }
    }, 0);
  }, [canRedo, dispatch]);

  return {
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
}
