/**
 * LoadingOverlay provides a full-screen overlay with loading indicator.
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

/**
 * Full-screen overlay that displays a loading spinner.
 * Blocks user interaction while async operations are in progress.
 */
export function LoadingOverlay({ isLoading, message = 'Loading...' }: LoadingOverlayProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          minWidth: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <LoadingSpinner size="large" />
        <div
          id="loading-message"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
