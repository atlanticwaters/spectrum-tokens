import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TabType = 'export' | 'settings' | 'sync';

export interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedTab: TabType;
  isExporting: boolean;
  exportProgress: {
    current: number;
    total: number;
    message: string;
  } | null;
}

const initialState: UIState = {
  isLoading: false,
  error: null,
  selectedTab: 'export',
  isExporting: false,
  exportProgress: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedTab: (state, action: PayloadAction<TabType>) => {
      state.selectedTab = action.payload;
    },
    setExporting: (state, action: PayloadAction<boolean>) => {
      state.isExporting = action.payload;
      if (!action.payload) {
        state.exportProgress = null;
      }
    },
    setExportProgress: (
      state,
      action: PayloadAction<{ current: number; total: number; message: string }>
    ) => {
      state.exportProgress = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setSelectedTab,
  setExporting,
  setExportProgress,
} = uiSlice.actions;

export default uiSlice.reducer;
