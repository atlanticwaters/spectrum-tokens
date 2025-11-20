import { describe, it, expect } from '@jest/globals';
import uiReducer, {
  setLoading,
  setError,
  clearError,
  setSelectedTab,
  setExporting,
  setExportProgress,
  UIState,
} from './uiSlice';

describe('uiSlice', () => {
  const initialState: UIState = {
    isLoading: false,
    error: null,
    selectedTab: 'export',
    isExporting: false,
    exportProgress: null,
  };

  it('should return initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = uiReducer(initialState, setLoading(true));
      expect(state.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state = uiReducer({ ...initialState, isLoading: true }, setLoading(false));
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const state = uiReducer(initialState, setError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });

    it('should set error to null', () => {
      const state = uiReducer(
        { ...initialState, error: 'Previous error' },
        setError(null)
      );
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const state = uiReducer({ ...initialState, error: 'Some error' }, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('setSelectedTab', () => {
    it('should set selected tab to export', () => {
      const state = uiReducer(initialState, setSelectedTab('export'));
      expect(state.selectedTab).toBe('export');
    });

    it('should set selected tab to settings', () => {
      const state = uiReducer(initialState, setSelectedTab('settings'));
      expect(state.selectedTab).toBe('settings');
    });

    it('should set selected tab to sync', () => {
      const state = uiReducer(initialState, setSelectedTab('sync'));
      expect(state.selectedTab).toBe('sync');
    });
  });

  describe('setExporting', () => {
    it('should set exporting to true', () => {
      const state = uiReducer(initialState, setExporting(true));
      expect(state.isExporting).toBe(true);
    });

    it('should set exporting to false and clear progress', () => {
      const stateWithProgress: UIState = {
        ...initialState,
        isExporting: true,
        exportProgress: { current: 50, total: 100, message: 'Exporting...' },
      };
      const state = uiReducer(stateWithProgress, setExporting(false));
      expect(state.isExporting).toBe(false);
      expect(state.exportProgress).toBeNull();
    });
  });

  describe('setExportProgress', () => {
    it('should set export progress', () => {
      const progress = { current: 25, total: 100, message: 'Processing tokens...' };
      const state = uiReducer(initialState, setExportProgress(progress));
      expect(state.exportProgress).toEqual(progress);
    });

    it('should update export progress', () => {
      const initialProgress = { current: 25, total: 100, message: 'Starting...' };
      const updatedProgress = { current: 75, total: 100, message: 'Almost done...' };

      let state = uiReducer(initialState, setExportProgress(initialProgress));
      expect(state.exportProgress).toEqual(initialProgress);

      state = uiReducer(state, setExportProgress(updatedProgress));
      expect(state.exportProgress).toEqual(updatedProgress);
    });
  });
});
