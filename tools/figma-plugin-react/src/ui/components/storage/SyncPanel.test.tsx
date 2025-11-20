import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { SyncPanel } from './SyncPanel';
import storageReducer from '../../store/slices/storageSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      storage: storageReducer,
    },
    preloadedState: {
      storage: {
        type: null,
        config: null,
        isConnected: false,
        lastSyncTime: null,
        syncStatus: 'idle' as const,
        error: null,
        ...initialState,
      },
    },
  });
};

describe('SyncPanel', () => {
  const mockOnPullClick = jest.fn();
  const mockOnPushClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no storage type is selected', () => {
    const store = createMockStore({ type: null });

    const { container } = render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders sync panel when storage type is selected', () => {
    const store = createMockStore({ type: 'github', isConnected: true });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByText(/sync status:/i)).toBeInTheDocument();
  });

  it('shows "Ready" status when idle', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'idle',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows "Syncing..." status when syncing', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'syncing',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('shows success status with timestamp', () => {
    const timestamp = Date.now();
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'success',
      lastSyncTime: timestamp,
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    const timeString = new Date(timestamp).toLocaleTimeString();
    expect(screen.getByText(`✓ Last synced: ${timeString}`)).toBeInTheDocument();
  });

  it('shows error status', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'error',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByText('✗ Error')).toBeInTheDocument();
  });

  it('displays error message when present', () => {
    const errorMessage = 'Failed to connect to GitHub';
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      error: errorMessage,
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
  });

  it('renders Pull Tokens button', () => {
    const store = createMockStore({ type: 'github', isConnected: true });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /pull tokens/i })).toBeInTheDocument();
  });

  it('renders Push Tokens button for writable storage', () => {
    const store = createMockStore({ type: 'github', isConnected: true });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /push tokens/i })).toBeInTheDocument();
  });

  it('does not render Push Tokens button for URL storage', () => {
    const store = createMockStore({ type: 'url', isConnected: true });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.queryByRole('button', { name: /push tokens/i })).not.toBeInTheDocument();
  });

  it('shows read-only note for URL storage', () => {
    const store = createMockStore({ type: 'url', isConnected: true });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByText(/url storage is read-only/i)).toBeInTheDocument();
  });

  it('disables buttons when not connected', () => {
    const store = createMockStore({ type: 'github', isConnected: false });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /pull tokens/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /push tokens/i })).toBeDisabled();
  });

  it('disables buttons when syncing', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'syncing',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /pull tokens/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /push tokens/i })).toBeDisabled();
  });

  it('enables buttons when connected and idle', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'idle',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /pull tokens/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /push tokens/i })).not.toBeDisabled();
  });

  it('calls onPullClick when Pull button is clicked', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'idle',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /pull tokens/i }));

    expect(mockOnPullClick).toHaveBeenCalledTimes(1);
  });

  it('calls onPushClick when Push button is clicked', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'idle',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /push tokens/i }));

    expect(mockOnPushClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on Pull button when syncing', () => {
    const store = createMockStore({
      type: 'github',
      isConnected: true,
      syncStatus: 'syncing',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    const pullButton = screen.getByRole('button', { name: /pull tokens/i });
    expect(pullButton).toHaveAttribute('aria-busy', 'true');
  });

  it('works with local storage type', () => {
    const store = createMockStore({
      type: 'local',
      isConnected: true,
      syncStatus: 'idle',
    });

    render(
      <Provider store={store}>
        <SyncPanel onPullClick={mockOnPullClick} onPushClick={mockOnPushClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /pull tokens/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /push tokens/i })).toBeInTheDocument();
    expect(screen.queryByText(/read-only/i)).not.toBeInTheDocument();
  });
});
