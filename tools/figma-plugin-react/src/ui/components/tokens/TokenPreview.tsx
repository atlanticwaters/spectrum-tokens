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
import type { Token } from './types';

interface TokenPreviewProps {
  token: Token;
  size?: number;
}

export function TokenPreview({ token, size = 32 }: TokenPreviewProps) {
  const renderPreview = () => {
    switch (token.type) {
      case 'color':
        return (
          <div
            style={{
              width: size,
              height: size,
              backgroundColor: token.value,
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            title={token.value}
            aria-label={`Color preview: ${token.value}`}
          />
        );

      case 'dimension':
      case 'spacing':
        return (
          <div
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              fontWeight: 500,
            }}
            title={`${token.value}px`}
          >
            {token.value}px
          </div>
        );

      case 'typography':
        return (
          <div
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 500,
            }}
            title={JSON.stringify(token.value)}
          >
            Aa
          </div>
        );

      case 'shadow':
      case 'effect':
        return (
          <div
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: '10px',
            }}
            title={token.type}
          >
            FX
          </div>
        );

      default:
        return (
          <div
            style={{
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              fontSize: '10px',
            }}
            title={token.type}
          >
            {token.type.substring(0, 2).toUpperCase()}
          </div>
        );
    }
  };

  return (
    <div className="token-preview" style={{ flexShrink: 0 }}>
      {renderPreview()}
    </div>
  );
}
