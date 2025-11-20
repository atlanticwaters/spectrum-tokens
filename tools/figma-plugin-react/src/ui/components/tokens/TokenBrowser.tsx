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

import React, { useState, useMemo } from 'react';
import { TokenList } from './TokenList';
import Input from '../Input';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectToken, deleteToken } from '../../store/slices/tokensSlice';
import type { Token } from './types';

export interface TokenBrowserProps {
  onTokenApply?: (token: Token) => void;
}

/**
 * TokenBrowser component for browsing and filtering design tokens.
 * Reads tokens from Redux store and dispatches actions for token interactions.
 */
export function TokenBrowser({ onTokenApply }: TokenBrowserProps) {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector((state) => state.tokens.tokens);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Get unique token types
  const tokenTypes = useMemo(() => {
    const types = new Set(tokens.map((t) => t.type));
    return ['all', ...Array.from(types).sort()];
  }, [tokens]);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || token.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [tokens, searchQuery, selectedType]);

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    dispatch(selectToken(token));
  };

  // Handle token deletion
  const handleTokenDelete = (tokenName: string) => {
    dispatch(deleteToken(tokenName));
  };

  return (
    <div
      className="token-browser"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
        <Input
          label="Search Tokens"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name..."
        />
        <div style={{ marginTop: '8px' }}>
          <label
            htmlFor="token-type-filter"
            style={{ fontSize: '12px', marginRight: '8px', fontWeight: 500 }}
          >
            Filter by type:
          </label>
          <select
            id="token-type-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
            }}
            aria-label="Filter tokens by type"
          >
            {tokenTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TokenList
          tokens={filteredTokens}
          onTokenSelect={handleTokenSelect}
          onTokenApply={onTokenApply}
        />
      </div>
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #e0e0e0',
          fontSize: '12px',
          color: '#666',
          backgroundColor: '#f9f9f9',
        }}
        role="status"
        aria-live="polite"
      >
        Showing {filteredTokens.length} of {tokens.length} tokens
      </div>
    </div>
  );
}
