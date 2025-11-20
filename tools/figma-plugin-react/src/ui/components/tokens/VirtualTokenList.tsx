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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Token } from './types';

export interface VirtualTokenListProps {
  /** Array of tokens to display */
  tokens: Token[];
  /** Callback when a token is clicked */
  onTokenClick?: (token: Token) => void;
  /** Callback when delete is requested */
  onTokenDelete?: (tokenId: string) => void;
  /** Height of each token item in pixels */
  itemHeight: number;
  /** Number of items to render as buffer before/after visible area */
  bufferSize?: number;
  /** Height of the viewport in pixels (defaults to auto-detect) */
  viewportHeight?: number;
  /** Custom render function for each token */
  renderToken?: (token: Token, index: number) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Virtual scrolling list for tokens
 *
 * Only renders visible tokens plus a buffer to improve performance
 * with large token lists. Uses window-based virtualization to handle
 * dynamic item heights efficiently.
 *
 * @example
 * <VirtualTokenList
 *   tokens={tokens}
 *   itemHeight={60}
 *   onTokenClick={handleTokenClick}
 *   onTokenDelete={handleTokenDelete}
 * />
 */
export function VirtualTokenList({
  tokens,
  onTokenClick,
  onTokenDelete,
  itemHeight,
  bufferSize = 5,
  viewportHeight = 400,
  renderToken,
  className = '',
}: VirtualTokenListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + viewportHeight) / itemHeight);

  // Add buffer
  const startIndex = Math.max(0, visibleStart - bufferSize);
  const endIndex = Math.min(tokens.length, visibleEnd + bufferSize);

  // Calculate total height and offset
  const totalHeight = tokens.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Get visible tokens
  const visibleTokens = tokens.slice(startIndex, endIndex);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle token click
  const handleTokenClick = useCallback(
    (token: Token) => {
      onTokenClick?.(token);
    },
    [onTokenClick]
  );

  // Handle token delete
  const handleTokenDelete = useCallback(
    (e: React.MouseEvent, tokenId: string) => {
      e.stopPropagation();
      onTokenDelete?.(tokenId);
    },
    [onTokenDelete]
  );

  // Default token renderer
  const defaultRenderToken = useCallback(
    (token: Token, index: number) => {
      return (
        <div
          key={token.name}
          className="virtual-token-item"
          style={{
            height: `${itemHeight}px`,
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fff',
            transition: 'background-color 0.2s ease',
          }}
          onClick={() => handleTokenClick(token)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 500,
                fontSize: '14px',
                marginBottom: '4px',
                color: '#333',
              }}
            >
              {token.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {token.type} • {String(token.value)}
            </div>
          </div>
          {onTokenDelete && (
            <button
              onClick={(e) => handleTokenDelete(e, token.name)}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#666',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              aria-label={`Delete ${token.name}`}
            >
              Delete
            </button>
          )}
        </div>
      );
    },
    [itemHeight, handleTokenClick, handleTokenDelete, onTokenDelete]
  );

  const tokenRenderer = renderToken || defaultRenderToken;

  // Maintain scroll position when tokens change
  useEffect(() => {
    if (containerRef.current) {
      // If we were at the bottom, stay at the bottom
      const wasAtBottom =
        scrollTop + viewportHeight >= totalHeight - itemHeight;
      if (wasAtBottom && tokens.length > 0) {
        const newTotalHeight = tokens.length * itemHeight;
        const newScrollTop = newTotalHeight - viewportHeight;
        containerRef.current.scrollTop = Math.max(0, newScrollTop);
      }
    }
  }, [tokens.length, itemHeight, viewportHeight, scrollTop, totalHeight]);

  return (
    <div
      ref={containerRef}
      className={`virtual-token-list ${className}`.trim()}
      style={{
        height: `${viewportHeight}px`,
        overflow: 'auto',
        position: 'relative',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
      }}
      onScroll={handleScroll}
    >
      {tokens.length === 0 ? (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#999',
          }}
        >
          No tokens to display
        </div>
      ) : (
        <div
          style={{
            height: `${totalHeight}px`,
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              willChange: 'transform',
            }}
          >
            {visibleTokens.map((token, index) =>
              tokenRenderer(token, startIndex + index)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to determine if virtual scrolling should be used
 *
 * @param tokenCount - Number of tokens
 * @param threshold - Threshold for enabling virtualization (default: 50)
 * @returns Whether to use virtual scrolling
 */
export function useShouldVirtualize(
  tokenCount: number,
  threshold: number = 50
): boolean {
  return tokenCount > threshold;
}

export default VirtualTokenList;
