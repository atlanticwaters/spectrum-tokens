/**
 * Toast notifications slice for displaying temporary messages to users.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ToastsState {
  toasts: Toast[];
}

const initialState: ToastsState = {
  toasts: [],
};

const toastsSlice = createSlice({
  name: 'toasts',
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<{
        message: string;
        type: ToastType;
        duration?: number;
      }>
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const toast: Toast = {
        id,
        message: action.payload.message,
        type: action.payload.type,
        duration: action.payload.duration ?? 3000,
      };
      state.toasts.push(toast);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },

    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastsSlice.actions;
export default toastsSlice.reducer;
