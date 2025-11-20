import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { StorageSelector } from './StorageSelector';
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

describe('StorageSelector', () => {
  it('renders storage selector with default value', () => {
    const store = createMockStore();
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    expect(screen.getByLabelText(/storage provider/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('displays all storage options', () => {
    const store = createMockStore();
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));

    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('None (Export only)');
    expect(options[1]).toHaveTextContent('GitHub');
    expect(options[2]).toHaveTextContent('Local Storage');
    expect(options[3]).toHaveTextContent('URL (Read-only)');
  });

  it('does not show configure button when no storage type is selected', () => {
    const store = createMockStore();
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    expect(screen.queryByRole('button', { name: /configure/i })).not.toBeInTheDocument();
  });

  it('shows configure button when storage type is selected', () => {
    const store = createMockStore({ type: 'github' });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /configure github/i })).toBeInTheDocument();
  });

  it('calls onConfigureClick when configure button is clicked', () => {
    const store = createMockStore({ type: 'github' });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /configure github/i }));

    expect(onConfigureClick).toHaveBeenCalledTimes(1);
  });

  it('dispatches setStorageType when storage type is changed', () => {
    const store = createMockStore();
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'github' } });

    const state = store.getState();
    expect(state.storage.type).toBe('github');
  });

  it('shows connected status when isConnected is true', () => {
    const store = createMockStore({ type: 'github', isConnected: true });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('does not show connected status when isConnected is false', () => {
    const store = createMockStore({ type: 'github', isConnected: false });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    expect(screen.queryByText('Connected')).not.toBeInTheDocument();
  });

  it('allows changing back to no storage provider', () => {
    const store = createMockStore({ type: 'github' });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });

    const state = store.getState();
    expect(state.storage.type).toBeNull();
  });

  it('renders with correct accessibility attributes', () => {
    const store = createMockStore({ type: 'github' });
    const onConfigureClick = jest.fn();

    render(
      <Provider store={store}>
        <StorageSelector onConfigureClick={onConfigureClick} />
      </Provider>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'storage-type');

    const label = screen.getByLabelText(/storage provider/i);
    expect(label).toHaveAttribute('id', 'storage-type');

    const button = screen.getByRole('button', { name: /configure github/i });
    expect(button).toHaveAttribute('aria-label', 'Configure github');
  });
});
