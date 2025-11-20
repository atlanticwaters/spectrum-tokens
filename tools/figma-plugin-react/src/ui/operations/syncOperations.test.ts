import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import storageReducer from '../store/slices/storageSlice';
import {
  initializeStorageProvider,
  pullTokens,
  pushTokens,
} from './syncOperations';
import { storageManager } from '../../storage/StorageManager';

// Mock storage classes
jest.mock('../../storage/GithubStorage', () => ({
  GithubStorage: jest.fn().mockImplementation((config: any) => ({
    name: 'GitHub',
    type: 'github',
    canRead: true,
    canWrite: true,
    config,
  })),
}));

jest.mock('../../storage/LocalStorage', () => ({
  LocalStorage: jest.fn().mockImplementation(() => ({
    name: 'Local Storage',
    type: 'local',
    canRead: true,
    canWrite: true,
  })),
}));

jest.mock('../../storage/UrlStorage', () => ({
  UrlStorage: jest.fn().mockImplementation((config: any) => ({
    name: 'URL Storage',
    type: 'url',
    canRead: true,
    canWrite: false,
    config,
  })),
}));

describe('syncOperations', () => {
  let store: any;

  beforeEach(() => {
    // Clear storage manager
    storageManager.clearActiveProvider();

    // Create fresh store
    store = configureStore({
      reducer: {
        storage: storageReducer,
      },
    });

    jest.clearAllMocks();
  });

  describe('initializeStorageProvider', () => {
    it('initializes GitHub storage provider', async () => {
      const config = {
        owner: 'adobe',
        repo: 'spectrum-tokens',
        path: 'tokens.json',
        token: 'test-token',
      };

      await store.dispatch(initializeStorageProvider('github', config));

      const state = store.getState().storage;
      expect(state.isConnected).toBe(true);
      expect(state.config).toEqual(config);
      expect(storageManager.getActiveProvider()).toBeTruthy();
      expect(storageManager.getActiveProvider()?.type).toBe('github');
    });

    it('initializes local storage provider', async () => {
      await store.dispatch(initializeStorageProvider('local', {}));

      const state = store.getState().storage;
      expect(state.isConnected).toBe(true);
      expect(storageManager.getActiveProvider()?.type).toBe('local');
    });

    it('initializes URL storage provider', async () => {
      const config = {
        url: 'https://example.com/tokens.json',
      };

      await store.dispatch(initializeStorageProvider('url', config));

      const state = store.getState().storage;
      expect(state.isConnected).toBe(true);
      expect(state.config).toEqual(config);
      expect(storageManager.getActiveProvider()?.type).toBe('url');
    });

    it('throws error for unknown storage type', async () => {
      await expect(
        store.dispatch(initializeStorageProvider('unknown', {}))
      ).rejects.toThrow('Unknown storage type');

      const state = store.getState().storage;
      expect(state.isConnected).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('sets error state when initialization fails', async () => {
      // Mock to throw error
      jest.spyOn(storageManager, 'register').mockImplementationOnce(() => {
        throw new Error('Registration failed');
      });

      await expect(
        store.dispatch(initializeStorageProvider('github', {}))
      ).rejects.toThrow();

      const state = store.getState().storage;
      expect(state.isConnected).toBe(false);
      expect(state.error).toBe('Registration failed');
    });
  });

  describe('pullTokens', () => {
    const mockTokenData = {
      tokens: {
        color: {
          primary: { value: '#0000ff', type: 'color' },
        },
      },
    };

    beforeEach(async () => {
      // Initialize a provider first
      await store.dispatch(
        initializeStorageProvider('github', {
          owner: 'test',
          repo: 'test',
          path: 'tokens.json',
          token: 'test',
        })
      );
    });

    it('pulls tokens successfully', async () => {
      jest.spyOn(storageManager, 'read').mockResolvedValueOnce(mockTokenData);

      const result = await store.dispatch(pullTokens());

      expect(result).toEqual(mockTokenData);

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('sets syncing status during pull', async () => {
      let resolvePull: any;
      const pullPromise = new Promise((resolve) => {
        resolvePull = resolve;
      });

      jest.spyOn(storageManager, 'read').mockReturnValueOnce(pullPromise as any);

      const dispatchPromise = store.dispatch(pullTokens());

      // Check status is syncing
      let state = store.getState().storage;
      expect(state.syncStatus).toBe('syncing');

      // Resolve the pull
      resolvePull(mockTokenData);
      await dispatchPromise;

      // Check status is success
      state = store.getState().storage;
      expect(state.syncStatus).toBe('success');
    });

    it('sets error state when pull fails', async () => {
      const errorMessage = 'Network error';
      jest.spyOn(storageManager, 'read').mockRejectedValueOnce(new Error(errorMessage));

      await expect(store.dispatch(pullTokens())).rejects.toThrow();

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe(errorMessage);
    });

    it('handles unknown error during pull', async () => {
      jest.spyOn(storageManager, 'read').mockRejectedValueOnce('Unknown error');

      await expect(store.dispatch(pullTokens())).rejects.toBeTruthy();

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe('Failed to pull tokens');
    });
  });

  describe('pushTokens', () => {
    const mockTokenData = {
      tokens: {
        color: {
          primary: { value: '#0000ff', type: 'color' },
        },
      },
    };

    beforeEach(async () => {
      // Initialize a provider first
      await store.dispatch(
        initializeStorageProvider('github', {
          owner: 'test',
          repo: 'test',
          path: 'tokens.json',
          token: 'test',
        })
      );
    });

    it('pushes tokens successfully', async () => {
      const writeSpy = jest.spyOn(storageManager, 'write').mockResolvedValueOnce(undefined);

      await store.dispatch(pushTokens(mockTokenData));

      expect(writeSpy).toHaveBeenCalledWith(mockTokenData);

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('sets syncing status during push', async () => {
      let resolvePush: any;
      const pushPromise = new Promise((resolve) => {
        resolvePush = resolve;
      });

      jest.spyOn(storageManager, 'write').mockReturnValueOnce(pushPromise as any);

      const dispatchPromise = store.dispatch(pushTokens(mockTokenData));

      // Check status is syncing
      let state = store.getState().storage;
      expect(state.syncStatus).toBe('syncing');

      // Resolve the push
      resolvePush(undefined);
      await dispatchPromise;

      // Check status is success
      state = store.getState().storage;
      expect(state.syncStatus).toBe('success');
    });

    it('sets error state when push fails', async () => {
      const errorMessage = 'Write failed';
      jest.spyOn(storageManager, 'write').mockRejectedValueOnce(new Error(errorMessage));

      await expect(store.dispatch(pushTokens(mockTokenData))).rejects.toThrow();

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe(errorMessage);
    });

    it('handles unknown error during push', async () => {
      jest.spyOn(storageManager, 'write').mockRejectedValueOnce('Unknown error');

      await expect(store.dispatch(pushTokens(mockTokenData))).rejects.toBeTruthy();

      const state = store.getState().storage;
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe('Failed to push tokens');
    });
  });
});
