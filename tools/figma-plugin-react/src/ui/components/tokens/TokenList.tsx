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
import { TokenItem } from './TokenItem';
import type { Token } from './types';

interface TokenListProps {
  tokens: Token[];
  onTokenSelect?: (token: Token) => void;
  onTokenApply?: (token: Token) => void;
}

export function TokenList({ tokens, onTokenSelect, onTokenApply }: TokenListProps) {
  if (tokens.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#999',
        }}
        role="status"
        aria-live="polite"
      >
        No tokens found
      </div>
    );
  }

  return (
    <div className="token-list" role="list">
      {tokens.map((token) => (
        <div key={token.name} role="listitem">
          <TokenItem
            token={token}
            onSelect={() => onTokenSelect?.(token)}
            onApply={() => onTokenApply?.(token)}
          />
        </div>
      ))}
    </div>
  );
}
