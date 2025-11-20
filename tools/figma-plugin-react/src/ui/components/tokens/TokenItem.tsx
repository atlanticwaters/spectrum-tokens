/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import React from 'react';
import { TokenPreview } from './TokenPreview';
import Button from '../Button';
import type { Token } from './types';

interface TokenItemProps {
  token: Token;
  onSelect?: () => void;
  onApply?: () => void;
}

export function TokenItem({ token, onSelect, onApply }: TokenItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  };

  return (
    <div
      className="token-item"
      style={{
        padding: '12px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`Token: ${token.name}`}
    >
      <TokenPreview token={token} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 500,
            fontSize: '13px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {token.name}
        </div>
        <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
          {token.type}
        </div>
        {token.description && (
          <div
            style={{
              fontSize: '11px',
              color: '#999',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={token.description}
          >
            {token.description}
          </div>
        )}
      </div>
      {onApply && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Button variant="secondary" onClick={onApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
