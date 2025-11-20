/**
 * Toast notification component for displaying temporary messages.
 */

import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

/**
 * Toast component that displays a temporary message and auto-dismisses.
 * Includes CSS transitions for smooth appearance/disappearance.
 */
export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '\u2713'; // ✓
      case 'error':
        return '\u2716'; // ✖
      case 'warning':
        return '\u26A0'; // ⚠
      case 'info':
        return '\u2139'; // ℹ
      default:
        return '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        marginBottom: '8px',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideIn 0.3s ease-out',
        fontSize: '14px',
        fontWeight: 500,
      }}
      role="alert"
      aria-live="polite"
    >
      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0 4px',
          lineHeight: '1',
          opacity: 0.8,
        }}
        aria-label="Close notification"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
