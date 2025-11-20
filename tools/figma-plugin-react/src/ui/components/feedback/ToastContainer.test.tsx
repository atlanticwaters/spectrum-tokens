import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ToastContainer } from './ToastContainer';
import toastsReducer, { addToast, removeToast, clearToasts } from '../../store/slices/toastsSlice';

function createTestStore(initialToasts: any[] = []) {
  return configureStore({
    reducer: {
      toasts: toastsReducer,
    },
    preloadedState: {
      toasts: {
        toasts: initialToasts,
      },
    },
  });
}

function renderWithRedux(store = createTestStore()) {
  return {
    ...render(
      <Provider store={store}>
        <ToastContainer />
      </Provider>
    ),
    store,
  };
}

describe('ToastContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when there are no toasts', () => {
      const { container } = renderWithRedux();
      expect(container.firstChild).toBeNull();
    });

    it('renders single toast', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Test message', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('renders multiple toasts', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'First toast', type: 'info' as const, duration: 3000 },
        { id: 'toast-2', message: 'Second toast', type: 'success' as const, duration: 3000 },
        { id: 'toast-3', message: 'Third toast', type: 'error' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });
  });

  describe('toast management', () => {
    it('adds toast to display', async () => {
      const { store } = renderWithRedux();

      store.dispatch(addToast({ message: 'New toast', type: 'info' }));

      await waitFor(() => {
        expect(screen.getByText('New toast')).toBeInTheDocument();
      });
    });

    it('removes toast from display', async () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Removable toast', type: 'info' as const, duration: 3000 },
      ];
      const { store } = renderWithRedux(createTestStore(initialToasts));

      expect(screen.getByText('Removable toast')).toBeInTheDocument();

      store.dispatch(removeToast('toast-1'));

      await waitFor(() => {
        expect(screen.queryByText('Removable toast')).not.toBeInTheDocument();
      });
    });

    it('clears all toasts', async () => {
      const initialToasts = [
        { id: 'toast-1', message: 'First', type: 'info' as const, duration: 3000 },
        { id: 'toast-2', message: 'Second', type: 'info' as const, duration: 3000 },
      ];
      const { store } = renderWithRedux(createTestStore(initialToasts));

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();

      store.dispatch(clearToasts());

      await waitFor(() => {
        expect(screen.queryByText('First')).not.toBeInTheDocument();
        expect(screen.queryByText('Second')).not.toBeInTheDocument();
      });
    });
  });

  describe('toast types', () => {
    it('displays success toast', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Success!', type: 'success' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('\u2713')).toBeInTheDocument(); // ✓
    });

    it('displays error toast', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Error!', type: 'error' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('\u2716')).toBeInTheDocument(); // ✖
    });

    it('displays warning toast', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Warning!', type: 'warning' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('Warning!')).toBeInTheDocument();
      expect(screen.getByText('\u26A0')).toBeInTheDocument(); // ⚠
    });

    it('displays info toast', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Info!', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      renderWithRedux(store);

      expect(screen.getByText('Info!')).toBeInTheDocument();
      expect(screen.getByText('\u2139')).toBeInTheDocument(); // ℹ
    });
  });

  describe('positioning', () => {
    it('uses fixed positioning', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Test', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      const { container } = renderWithRedux(store);

      const toastContainer = container.firstChild as HTMLElement;
      expect(toastContainer.style.position).toBe('fixed');
    });

    it('positions at bottom-right', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Test', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      const { container } = renderWithRedux(store);

      const toastContainer = container.firstChild as HTMLElement;
      expect(toastContainer.style.bottom).toBe('20px');
      expect(toastContainer.style.right).toBe('20px');
    });
  });

  describe('accessibility', () => {
    it('has aria-live="polite"', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Test', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      const { container } = renderWithRedux(store);

      const toastContainer = container.firstChild as HTMLElement;
      expect(toastContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic="false"', () => {
      const initialToasts = [
        { id: 'toast-1', message: 'Test', type: 'info' as const, duration: 3000 },
      ];
      const store = createTestStore(initialToasts);
      const { container } = renderWithRedux(store);

      const toastContainer = container.firstChild as HTMLElement;
      expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('Redux integration', () => {
    it('responds to store changes', async () => {
      const { store } = renderWithRedux();

      // Add first toast
      store.dispatch(addToast({ message: 'First', type: 'info' }));
      await waitFor(() => {
        expect(screen.getByText('First')).toBeInTheDocument();
      });

      // Add second toast
      store.dispatch(addToast({ message: 'Second', type: 'success' }));
      await waitFor(() => {
        expect(screen.getByText('Second')).toBeInTheDocument();
      });

      // Both should be visible
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});
