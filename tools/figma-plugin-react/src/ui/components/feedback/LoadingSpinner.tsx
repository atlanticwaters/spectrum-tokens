/**
 * LoadingSpinner component displays an animated spinner.
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

/**
 * Animated loading spinner component.
 * Supports three sizes and optional loading message.
 */
export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const getSizeInPixels = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      default:
        return 32;
    }
  };

  const sizeInPx = getSizeInPixels();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: message ? '12px' : '0',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        style={{
          width: `${sizeInPx}px`,
          height: `${sizeInPx}px`,
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
        aria-hidden="true"
      />
      {message && (
        <span
          style={{
            fontSize: '14px',
            color: '#666',
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
