import React from 'react';
import { useAppSelector } from '../../store/hooks';
import Button from '../Button';

interface SyncPanelProps {
  onPullClick: () => void;
  onPushClick: () => void;
}

export function SyncPanel({ onPullClick, onPushClick }: SyncPanelProps) {
  const { type, isConnected, syncStatus, lastSyncTime, error } = useAppSelector(
    (state) => state.storage
  );

  if (!type) {
    return null;
  }

  const canSync = isConnected && syncStatus !== 'syncing';
  const canPush = type !== 'url'; // URL is read-only

  const formatSyncTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div
      className="sync-panel"
      style={{
        padding: '12px',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
      }}
    >
      <div style={{ marginBottom: '12px', fontSize: '14px' }}>
        <strong>Sync Status:</strong>{' '}
        {syncStatus === 'idle' && <span>Ready</span>}
        {syncStatus === 'syncing' && (
          <span style={{ color: '#ff9800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>⏳</span>
            <span>Syncing...</span>
          </span>
        )}
        {syncStatus === 'success' && lastSyncTime && (
          <span style={{ color: '#4caf50' }}>
            ✓ Last synced: {formatSyncTime(lastSyncTime)}
          </span>
        )}
        {syncStatus === 'error' && <span style={{ color: '#f44336' }}>✗ Error</span>}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            padding: '8px',
            marginBottom: '12px',
            fontSize: '12px',
            color: '#900',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={onPullClick} disabled={!canSync} loading={syncStatus === 'syncing'}>
          Pull Tokens
        </Button>
        {canPush && (
          <Button onClick={onPushClick} disabled={!canSync} variant="secondary">
            Push Tokens
          </Button>
        )}
      </div>

      {!canPush && type === 'url' && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#666',
            fontStyle: 'italic',
          }}
        >
          Note: URL storage is read-only
        </div>
      )}
    </div>
  );
}
