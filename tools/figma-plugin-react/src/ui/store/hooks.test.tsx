import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from './hooks';
import uiReducer, { setLoading } from './slices/uiSlice';
import collectionsReducer from './slices/collectionsSlice';
import settingsReducer from './slices/settingsSlice';

describe('Redux hooks', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        ui: uiReducer,
        collections: collectionsReducer,
        settings: settingsReducer,
      },
    });

  describe('useAppDispatch', () => {
    it('returns dispatch function', () => {
      const store = createTestStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      expect(typeof result.current).toBe('function');
    });

    it('can dispatch actions', () => {
      const store = createTestStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      result.current(setLoading(true));

      expect(store.getState().ui.isLoading).toBe(true);
    });
  });

  describe('useAppSelector', () => {
    it('selects state from store', () => {
      const store = createTestStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppSelector((state) => state.ui.isLoading), {
        wrapper,
      });

      expect(result.current).toBe(false);
    });

    it('updates when state changes', () => {
      const store = createTestStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result, rerender } = renderHook(
        () => useAppSelector((state) => state.ui.isLoading),
        { wrapper }
      );

      expect(result.current).toBe(false);

      store.dispatch(setLoading(true));
      rerender();

      expect(result.current).toBe(true);
    });

    it('can select complex state', () => {
      const store = createTestStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(
        () => useAppSelector((state) => state.settings.exportSettings),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current.format).toBe('both');
    });
  });
});
