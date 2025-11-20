import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import App from './App';
import uiReducer from './store/slices/uiSlice';
import collectionsReducer from './store/slices/collectionsSlice';
import settingsReducer from './store/slices/settingsSlice';
import storageReducer from './store/slices/storageSlice';
import type { CollectionSelection } from '../shared/types';

// Mock Octokit to avoid ES module issues
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      getContent: jest.fn(),
      createOrUpdateFileContents: jest.fn(),
      get: jest.fn(),
    },
  })),
}));

// Create a test store
const createTestStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      collections: collectionsReducer,
      settings: settingsReducer,
      storage: storageReducer,
    },
  });

describe('App', () => {
  beforeEach(() => {
    // Clear mock calls
    if (jest.isMockFunction(parent.postMessage)) {
      (parent.postMessage as jest.Mock).mockClear();
    }
  });

  it('renders app title', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Spectrum Token Manager (React)')).toBeInTheDocument();
  });

  it('sends scan-collections message on mount', () => {
    const mockPostMessage = jest.fn();
    const originalPostMessage = parent.postMessage;
    parent.postMessage = mockPostMessage;

    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: 'scan-collections',
        },
      },
      '*'
    );

    parent.postMessage = originalPostMessage;
  });

  it('displays collections when scanned', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const mockCollections: CollectionSelection[] = [
      {
        collectionId: '1',
        collectionName: 'Test Collection',
        modes: ['light'],
        selectedModes: ['light'],
        variableCount: 10,
        selected: true,
      },
    ];

    // Simulate message from plugin
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'collections-scanned',
          payload: {
            collections: mockCollections,
          },
        },
      },
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(screen.getByText(/React \+ Redux is working!/i)).toBeInTheDocument();
      expect(screen.getByText(/Found 1 collection/i)).toBeInTheDocument();
      expect(screen.getByText('Test Collection (10 variables)')).toBeInTheDocument();
    });
  });

  it('displays error when export fails', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Simulate error message from plugin
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'export-error',
          payload: {
            success: false,
            error: 'Something went wrong',
          },
        },
      },
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('sends close-plugin message when close button is clicked', async () => {
    const mockPostMessage = jest.fn();
    const originalPostMessage = parent.postMessage;
    parent.postMessage = mockPostMessage;

    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const mockCollections: CollectionSelection[] = [
      {
        collectionId: '1',
        collectionName: 'Test Collection',
        modes: ['light'],
        selectedModes: ['light'],
        variableCount: 10,
        selected: true,
      },
    ];

    // Simulate message from plugin
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'collections-scanned',
          payload: {
            collections: mockCollections,
          },
        },
      },
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(screen.getByText('Close Plugin')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close Plugin');
    closeButton.click();

    expect(mockPostMessage).toHaveBeenCalledWith(
      {
        pluginMessage: {
          type: 'close-plugin',
        },
      },
      '*'
    );

    parent.postMessage = originalPostMessage;
  });

  it('logs export progress messages', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Simulate progress message from plugin
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'export-progress',
          payload: {
            current: 5,
            total: 10,
            message: 'Processing...',
          },
        },
      },
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Export progress:', {
        current: 5,
        total: 10,
        message: 'Processing...',
      });
    });

    consoleSpy.mockRestore();
  });

  it('logs export complete messages', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Simulate complete message from plugin
    const messageEvent = new MessageEvent('message', {
      data: {
        pluginMessage: {
          type: 'export-complete',
          payload: {
            success: true,
          },
        },
      },
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Export complete:', {
        success: true,
      });
    });

    consoleSpy.mockRestore();
  });
});
