/**
 * ToastContainer manages and displays multiple toast notifications.
 */

import React from 'react';
import { Toast } from './Toast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeToast } from '../../store/slices/toastsSlice';

/**
 * Container component that manages multiple toast notifications.
 * Renders toasts in a fixed position (bottom-right) and stacks them vertically.
 */
export function ToastContainer() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toasts.toasts);

  const handleClose = (id: string) => {
    dispatch(removeToast(id));
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </div>
  );
}
