import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type StorageType = 'github' | 'local' | 'url';
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface StorageState {
  type: StorageType | null;
  config: any;
  isConnected: boolean;
  lastSyncTime: number | null;
  syncStatus: SyncStatus;
  error: string | null;
}

const initialState: StorageState = {
  type: null,
  config: null,
  isConnected: false,
  lastSyncTime: null,
  syncStatus: 'idle',
  error: null,
};

const storageSlice = createSlice({
  name: 'storage',
  initialState,
  reducers: {
    setStorageType(state, action: PayloadAction<StorageType>) {
      state.type = action.payload;
      state.isConnected = false;
    },
    setStorageConfig(state, action: PayloadAction<any>) {
      state.config = action.payload;
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.syncStatus = action.payload;
    },
    setSyncSuccess(state) {
      state.syncStatus = 'success';
      state.lastSyncTime = Date.now();
      state.error = null;
    },
    setSyncError(state, action: PayloadAction<string>) {
      state.syncStatus = 'error';
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    resetStorage() {
      return initialState;
    },
  },
});

export const {
  setStorageType,
  setStorageConfig,
  setConnected,
  setSyncStatus,
  setSyncSuccess,
  setSyncError,
  clearError,
  resetStorage,
} = storageSlice.actions;

export default storageSlice.reducer;
