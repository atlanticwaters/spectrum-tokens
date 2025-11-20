import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { undo, redo, selectCanUndo, selectCanRedo, selectHistorySize } from '../../store/slices/historySlice';
import { setTokens } from '../../store/slices/tokensSlice';
import { addToast } from '../../store/slices/toastsSlice';

export interface HistoryButtonsProps {
  /** Additional CSS classes */
  className?: string;
  /** Show keyboard shortcut hints in tooltips */
  showShortcutHints?: boolean;
}

/**
 * History buttons component for undo/redo functionality
 *
 * Provides undo and redo buttons with appropriate disabled states
 * and tooltips showing keyboard shortcuts.
 */
export function HistoryButtons({ className = '', showShortcutHints = true }: HistoryButtonsProps) {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const historySize = useAppSelector(selectHistorySize);

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const handleUndo = () => {
    if (!canUndo) return;

    // Perform undo
    dispatch(undo());

    // Get the restored state and apply it to tokens
    const presentState = (window as any).store?.getState().history.present;
    if (presentState) {
      dispatch(setTokens(presentState.tokens));
      dispatch(
        addToast({
          message: 'Undone',
          type: 'info',
          duration: 2000,
        })
      );
    }
  };

  const handleRedo = () => {
    if (!canRedo) return;

    // Perform redo
    dispatch(redo());

    // Get the restored state and apply it to tokens
    const presentState = (window as any).store?.getState().history.present;
    if (presentState) {
      dispatch(setTokens(presentState.tokens));
      dispatch(
        addToast({
          message: 'Redone',
          type: 'info',
          duration: 2000,
        })
      );
    }
  };

  const undoTooltip = showShortcutHints
    ? `Undo (${modKey}+Z)${historySize.past > 0 ? ` - ${historySize.past} action(s)` : ''}`
    : 'Undo';

  const redoTooltip = showShortcutHints
    ? `Redo (${modKey}+Shift+Z)${historySize.future > 0 ? ` - ${historySize.future} action(s)` : ''}`
    : 'Redo';

  return (
    <div className={`history-buttons ${className}`.trim()} style={{ display: 'flex', gap: '8px' }}>
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        title={undoTooltip}
        aria-label={undoTooltip}
        className="history-button undo-button"
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: canUndo ? '#fff' : '#f5f5f5',
          color: canUndo ? '#333' : '#999',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s ease',
        }}
      >
        <span aria-hidden="true">↶</span>
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        title={redoTooltip}
        aria-label={redoTooltip}
        className="history-button redo-button"
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: canRedo ? '#fff' : '#f5f5f5',
          color: canRedo ? '#333' : '#999',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontFamily: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s ease',
        }}
      >
        <span aria-hidden="true">↷</span>
        <span>Redo</span>
      </button>
    </div>
  );
}

export default HistoryButtons;
