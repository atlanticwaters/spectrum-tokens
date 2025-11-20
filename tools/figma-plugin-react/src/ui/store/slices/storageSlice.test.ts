import storageReducer, {
  setStorageType,
  setStorageConfig,
  setConnected,
  setSyncStatus,
  setSyncSuccess,
  setSyncError,
  clearError,
  resetStorage,
  type StorageState,
} from './storageSlice';

describe('storageSlice', () => {
  const initialState: StorageState = {
    type: null,
    config: null,
    isConnected: false,
    lastSyncTime: null,
    syncStatus: 'idle',
    error: null,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(storageReducer(undefined, { type: 'unknown' } as any)).toEqual(initialState);
    });
  });

  describe('setStorageType', () => {
    it('should set storage type', () => {
      const state = storageReducer(initialState, setStorageType('github'));
      expect(state.type).toBe('github');
      expect(state.isConnected).toBe(false);
    });

    it('should disconnect when changing storage type', () => {
      const connectedState: StorageState = {
        ...initialState,
        type: 'local',
        isConnected: true,
      };

      const state = storageReducer(connectedState, setStorageType('github'));
      expect(state.type).toBe('github');
      expect(state.isConnected).toBe(false);
    });

    it('should handle all storage types', () => {
      const types = ['github', 'local', 'url'] as const;

      types.forEach((type) => {
        const state = storageReducer(initialState, setStorageType(type));
        expect(state.type).toBe(type);
      });
    });
  });

  describe('setStorageConfig', () => {
    it('should set storage config', () => {
      const config = {
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'tokens.json',
        token: 'test-token',
      };

      const state = storageReducer(initialState, setStorageConfig(config));
      expect(state.config).toEqual(config);
    });

    it('should overwrite existing config', () => {
      const oldConfig = { url: 'https://old.com' };
      const newConfig = { url: 'https://new.com' };

      let state = storageReducer(initialState, setStorageConfig(oldConfig));
      expect(state.config).toEqual(oldConfig);

      state = storageReducer(state, setStorageConfig(newConfig));
      expect(state.config).toEqual(newConfig);
    });
  });

  describe('setConnected', () => {
    it('should set connected to true', () => {
      const state = storageReducer(initialState, setConnected(true));
      expect(state.isConnected).toBe(true);
    });

    it('should set connected to false', () => {
      const connectedState: StorageState = {
        ...initialState,
        isConnected: true,
      };

      const state = storageReducer(connectedState, setConnected(false));
      expect(state.isConnected).toBe(false);
    });
  });

  describe('setSyncStatus', () => {
    it('should set sync status to syncing', () => {
      const state = storageReducer(initialState, setSyncStatus('syncing'));
      expect(state.syncStatus).toBe('syncing');
    });

    it('should handle all sync statuses', () => {
      const statuses = ['idle', 'syncing', 'success', 'error'] as const;

      statuses.forEach((status) => {
        const state = storageReducer(initialState, setSyncStatus(status));
        expect(state.syncStatus).toBe(status);
      });
    });
  });

  describe('setSyncSuccess', () => {
    it('should set success state', () => {
      const beforeTime = Date.now();
      const state = storageReducer(initialState, setSyncSuccess());
      const afterTime = Date.now();

      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.lastSyncTime).toBeLessThanOrEqual(afterTime);
      expect(state.error).toBeNull();
    });

    it('should clear previous error', () => {
      const errorState: StorageState = {
        ...initialState,
        error: 'Previous error',
        syncStatus: 'error',
      };

      const state = storageReducer(errorState, setSyncSuccess());
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('success');
    });
  });

  describe('setSyncError', () => {
    it('should set error state', () => {
      const errorMessage = 'Sync failed';
      const state = storageReducer(initialState, setSyncError(errorMessage));

      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe(errorMessage);
    });

    it('should overwrite previous error', () => {
      const errorState: StorageState = {
        ...initialState,
        error: 'Old error',
        syncStatus: 'error',
      };

      const state = storageReducer(errorState, setSyncError('New error'));
      expect(state.error).toBe('New error');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const errorState: StorageState = {
        ...initialState,
        error: 'Test error',
        syncStatus: 'error',
      };

      const state = storageReducer(errorState, clearError());
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('error'); // Status unchanged
    });

    it('should be idempotent', () => {
      const state = storageReducer(initialState, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('resetStorage', () => {
    it('should reset to initial state', () => {
      const modifiedState: StorageState = {
        type: 'github',
        config: { owner: 'test' },
        isConnected: true,
        lastSyncTime: Date.now(),
        syncStatus: 'success',
        error: null,
      };

      const state = storageReducer(modifiedState, resetStorage());
      expect(state).toEqual(initialState);
    });

    it('should clear error on reset', () => {
      const errorState: StorageState = {
        ...initialState,
        error: 'Test error',
        syncStatus: 'error',
      };

      const state = storageReducer(errorState, resetStorage());
      expect(state.error).toBeNull();
      expect(state.syncStatus).toBe('idle');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete setup flow', () => {
      let state = storageReducer(initialState, setStorageType('github'));
      expect(state.type).toBe('github');

      state = storageReducer(
        state,
        setStorageConfig({
          owner: 'adobe',
          repo: 'spectrum-tokens',
          path: 'tokens.json',
          token: 'secret',
        })
      );
      expect(state.config).toBeTruthy();

      state = storageReducer(state, setConnected(true));
      expect(state.isConnected).toBe(true);
    });

    it('should handle sync success flow', () => {
      let state = storageReducer(initialState, setSyncStatus('syncing'));
      expect(state.syncStatus).toBe('syncing');

      state = storageReducer(state, setSyncSuccess());
      expect(state.syncStatus).toBe('success');
      expect(state.lastSyncTime).toBeTruthy();
      expect(state.error).toBeNull();
    });

    it('should handle sync error flow', () => {
      let state = storageReducer(initialState, setSyncStatus('syncing'));
      expect(state.syncStatus).toBe('syncing');

      state = storageReducer(state, setSyncError('Network error'));
      expect(state.syncStatus).toBe('error');
      expect(state.error).toBe('Network error');

      state = storageReducer(state, clearError());
      expect(state.error).toBeNull();
    });

    it('should handle retry after error', () => {
      let state = storageReducer(initialState, setSyncStatus('syncing'));
      state = storageReducer(state, setSyncError('First attempt failed'));
      expect(state.syncStatus).toBe('error');

      // Retry
      state = storageReducer(state, setSyncStatus('syncing'));
      expect(state.syncStatus).toBe('syncing');
      expect(state.error).toBe('First attempt failed'); // Error persists until cleared

      state = storageReducer(state, setSyncSuccess());
      expect(state.syncStatus).toBe('success');
      expect(state.error).toBeNull(); // Error cleared on success
    });
  });
});
