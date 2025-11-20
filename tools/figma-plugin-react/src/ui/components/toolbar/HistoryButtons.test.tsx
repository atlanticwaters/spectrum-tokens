import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { HistoryButtons } from './HistoryButtons';
import historyReducer from '../../store/slices/historySlice';
import tokensReducer from '../../store/slices/tokensSlice';
import toastsReducer from '../../store/slices/toastsSlice';

// Mock navigator.platform
const originalPlatform = navigator.platform;

describe('HistoryButtons', () => {
  let store: ReturnType<typeof configureStore>;

  const createTestStore = (initialState?: any) => {
    return configureStore({
      reducer: {
        history: historyReducer,
        tokens: tokensReducer,
        toasts: toastsReducer,
      },
      preloadedState: initialState,
    });
  };

  const renderWithStore = (component: React.ReactElement, customStore?: any) => {
    const testStore = customStore || store;
    // Attach store to window for component access
    (window as any).store = testStore;
    return render(<Provider store={testStore}>{component}</Provider>);
  };

  beforeEach(() => {
    store = createTestStore();
  });

  afterEach(() => {
    // Restore platform
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
    delete (window as any).store;
  });

  describe('rendering', () => {
    it('should render undo and redo buttons', () => {
      renderWithStore(<HistoryButtons />);

      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithStore(<HistoryButtons className="custom-class" />);

      const historyButtons = container.querySelector('.history-buttons');
      expect(historyButtons).toHaveClass('custom-class');
    });

    it('should render with icons', () => {
      renderWithStore(<HistoryButtons />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton.textContent).toContain('↶');
      expect(redoButton.textContent).toContain('↷');
    });
  });

  describe('disabled states', () => {
    it('should disable undo button when no history', () => {
      renderWithStore(<HistoryButtons />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when no future history', () => {
      renderWithStore(<HistoryButtons />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });

    it('should enable undo button when history exists', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [],
          canUndo: true,
          canRedo: false,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      renderWithStore(<HistoryButtons />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    it('should enable redo button when future history exists', () => {
      const storeWithFuture = createTestStore({
        history: {
          past: [],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          canUndo: false,
          canRedo: true,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      renderWithStore(<HistoryButtons />, storeWithFuture);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
    });
  });

  describe('keyboard shortcut hints', () => {
    it('should show Mac shortcuts on Mac', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      });

      renderWithStore(<HistoryButtons showShortcutHints={true} />);

      const undoButton = screen.getByRole('button', { name: /cmd\+z/i });
      const redoButton = screen.getByRole('button', { name: /cmd\+shift\+z/i });

      expect(undoButton).toBeInTheDocument();
      expect(redoButton).toBeInTheDocument();
    });

    it('should show Windows shortcuts on Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        writable: true,
      });

      renderWithStore(<HistoryButtons showShortcutHints={true} />);

      const undoButton = screen.getByRole('button', { name: /ctrl\+z/i });
      const redoButton = screen.getByRole('button', { name: /ctrl\+shift\+z/i });

      expect(undoButton).toBeInTheDocument();
      expect(redoButton).toBeInTheDocument();
    });

    it('should hide shortcuts when showShortcutHints is false', () => {
      renderWithStore(<HistoryButtons showShortcutHints={false} />);

      const undoButton = screen.getByRole('button', { name: /^undo$/i });
      const redoButton = screen.getByRole('button', { name: /^redo$/i });

      expect(undoButton).toBeInTheDocument();
      expect(redoButton).toBeInTheDocument();
    });

    it('should show history count in tooltip when available', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [
            { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
            { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          ],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          canUndo: true,
          canRedo: true,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      renderWithStore(<HistoryButtons showShortcutHints={true} />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /2 action/i });
      const redoButton = screen.getByRole('button', { name: /1 action/i });

      expect(undoButton).toBeInTheDocument();
      expect(redoButton).toBeInTheDocument();
    });
  });

  describe('undo functionality', () => {
    it('should not call undo when button is disabled', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithStore(<HistoryButtons />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      // Should not dispatch undo action
      expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'history/undo' }));
    });

    it('should dispatch undo action when button is clicked and enabled', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          present: { tokens: [{ name: 'token1', value: '#000', type: 'color' }], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [],
          canUndo: true,
          canRedo: false,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      const dispatchSpy = jest.spyOn(storeWithHistory, 'dispatch');
      renderWithStore(<HistoryButtons />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      // Should dispatch undo action
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'history/undo' }));
    });

    it('should show toast after undo', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          present: { tokens: [{ name: 'token1', value: '#000', type: 'color' }], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [],
          canUndo: true,
          canRedo: false,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      const dispatchSpy = jest.spyOn(storeWithHistory, 'dispatch');
      renderWithStore(<HistoryButtons />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      // Should show toast
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'toasts/showToast',
          payload: expect.objectContaining({
            message: 'Undone',
            type: 'info',
          }),
        })
      );
    });
  });

  describe('redo functionality', () => {
    it('should not call redo when button is disabled', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      renderWithStore(<HistoryButtons />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      fireEvent.click(redoButton);

      // Should not dispatch redo action
      expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'history/redo' }));
    });

    it('should dispatch redo action when button is clicked and enabled', () => {
      const storeWithFuture = createTestStore({
        history: {
          past: [],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [{ tokens: [{ name: 'token1', value: '#000', type: 'color' }], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          canUndo: false,
          canRedo: true,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      const dispatchSpy = jest.spyOn(storeWithFuture, 'dispatch');
      renderWithStore(<HistoryButtons />, storeWithFuture);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      fireEvent.click(redoButton);

      // Should dispatch redo action
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'history/redo' }));
    });

    it('should show toast after redo', () => {
      const storeWithFuture = createTestStore({
        history: {
          past: [],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [{ tokens: [{ name: 'token1', value: '#000', type: 'color' }], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          canUndo: false,
          canRedo: true,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      const dispatchSpy = jest.spyOn(storeWithFuture, 'dispatch');
      renderWithStore(<HistoryButtons />, storeWithFuture);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      fireEvent.click(redoButton);

      // Should show toast
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'toasts/showToast',
          payload: expect.objectContaining({
            message: 'Redone',
            type: 'info',
          }),
        })
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithStore(<HistoryButtons />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).toHaveAttribute('aria-label');
      expect(redoButton).toHaveAttribute('aria-label');
    });

    it('should have title attributes for tooltips', () => {
      renderWithStore(<HistoryButtons />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).toHaveAttribute('title');
      expect(redoButton).toHaveAttribute('title');
    });

    it('should mark icons as aria-hidden', () => {
      const { container } = renderWithStore(<HistoryButtons />);

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('styling', () => {
    it('should have different cursor styles based on disabled state', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [],
          canUndo: true,
          canRedo: false,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      renderWithStore(<HistoryButtons />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).toHaveStyle({ cursor: 'pointer' });
      expect(redoButton).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('should have different background colors based on disabled state', () => {
      const storeWithHistory = createTestStore({
        history: {
          past: [{ tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null }],
          present: { tokens: [], selectedToken: null, editingToken: null, isLoading: false, error: null },
          future: [],
          canUndo: true,
          canRedo: false,
          maxHistorySize: 50,
          lastActionDescription: null,
        },
      });

      renderWithStore(<HistoryButtons />, storeWithHistory);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).toHaveStyle({ backgroundColor: '#fff' });
      expect(redoButton).toHaveStyle({ backgroundColor: '#f5f5f5' });
    });
  });
});
