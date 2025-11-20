import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setStorageType } from '../../store/slices/storageSlice';

interface StorageSelectorProps {
  onConfigureClick: () => void;
}

export function StorageSelector({ onConfigureClick }: StorageSelectorProps) {
  const { type, isConnected } = useAppSelector((state) => state.storage);
  const dispatch = useAppDispatch();

  const handleStorageTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === '') {
      dispatch(setStorageType(null as any));
    } else {
      dispatch(setStorageType(value as any));
    }
  };

  return (
    <div className="storage-selector" style={{ padding: '12px' }}>
      <label
        htmlFor="storage-type"
        style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}
      >
        Storage Provider:
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          id="storage-type"
          value={type || ''}
          onChange={handleStorageTypeChange}
          style={{
            flex: 1,
            padding: '6px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="">None (Export only)</option>
          <option value="github">GitHub</option>
          <option value="local">Local Storage</option>
          <option value="url">URL (Read-only)</option>
        </select>
        {type && (
          <button
            onClick={onConfigureClick}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            aria-label={`Configure ${type}`}
          >
            Configure
          </button>
        )}
      </div>
      {isConnected && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#4caf50',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>✓</span>
          <span>Connected</span>
        </div>
      )}
    </div>
  );
}
