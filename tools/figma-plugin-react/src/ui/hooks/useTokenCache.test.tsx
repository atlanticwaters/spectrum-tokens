/**
 * Copyright 2024 Adobe. All rights reserved.
 */

import { renderHook } from '@testing-library/react';
import { useTokenCache } from './useTokenCache';
import type { Token } from '../components/tokens/types';

const createMockTokens = (): Token[] => [
  { name: 'color-primary', value: '#1976d2', type: 'color', collectionId: 'colors' },
  { name: 'color-secondary', value: '#dc004e', type: 'color', collectionId: 'colors' },
  { name: 'spacing-small', value: '8px', type: 'dimension', collectionId: 'spacing' },
  { name: 'spacing-medium', value: '16px', type: 'dimension', collectionId: 'spacing' },
  { name: 'font-size-body', value: '14px', type: 'dimension', description: 'Body text size' },
];

describe('useTokenCache', () => {
  describe('getFilteredTokens', () => {
    it('should filter by type', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const filtered = result.current.getFilteredTokens(tokens, { type: 'color' });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.type === 'color')).toBe(true);
    });

    it('should filter by collection', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const filtered = result.current.getFilteredTokens(tokens, { collectionId: 'spacing' });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(t => t.collectionId === 'spacing')).toBe(true);
    });

    it('should filter by search query in name', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const filtered = result.current.getFilteredTokens(tokens, { search: 'primary' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('color-primary');
    });

    it('should filter by search query in value', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const filtered = result.current.getFilteredTokens(tokens, { search: '8px' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('spacing-small');
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const filtered = result.current.getFilteredTokens(tokens, {
        type: 'dimension',
        collectionId: 'spacing',
      });

      expect(filtered).toHaveLength(2);
    });

    it('should cache results', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const first = result.current.getFilteredTokens(tokens, { type: 'color' });
      const second = result.current.getFilteredTokens(tokens, { type: 'color' });

      expect(first).toBe(second); // Same reference
    });
  });

  describe('getSortedTokens', () => {
    it('should sort by name ascending', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const sorted = result.current.getSortedTokens(tokens, { field: 'name', direction: 'asc' });

      expect(sorted[0].name).toBe('color-primary');
      expect(sorted[sorted.length - 1].name).toBe('spacing-small');
    });

    it('should sort by name descending', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const sorted = result.current.getSortedTokens(tokens, { field: 'name', direction: 'desc' });

      expect(sorted[0].name).toBe('spacing-small');
      expect(sorted[sorted.length - 1].name).toBe('color-primary');
    });

    it('should sort by type', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const sorted = result.current.getSortedTokens(tokens, { field: 'type', direction: 'asc' });

      expect(sorted[0].type).toBe('color');
    });

    it('should cache results', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const first = result.current.getSortedTokens(tokens, { field: 'name', direction: 'asc' });
      const second = result.current.getSortedTokens(tokens, { field: 'name', direction: 'asc' });

      expect(first).toBe(second);
    });
  });

  describe('searchTokens', () => {
    it('should return all tokens for empty query', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const results = result.current.searchTokens(tokens, '');

      expect(results).toHaveLength(tokens.length);
    });

    it('should find tokens by exact name', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const results = result.current.searchTokens(tokens, 'color-primary');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('color-primary');
    });

    it('should find tokens by partial name', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const results = result.current.searchTokens(tokens, 'spacing');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should cache search results', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const first = result.current.searchTokens(tokens, 'color');
      const second = result.current.searchTokens(tokens, 'color');

      expect(first).toBe(second);
    });
  });

  describe('getTokenDependencies', () => {
    it('should find tokens that reference another token', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens: Token[] = [
        { name: 'base-color', value: '#000', type: 'color' },
        { name: 'text-color', value: '{base-color}', type: 'color' },
      ];

      const deps = result.current.getTokenDependencies(tokens, 'base-color');

      expect(deps.has('text-color')).toBe(true);
    });

    it('should return empty set for tokens with no dependencies', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const deps = result.current.getTokenDependencies(tokens, 'color-primary');

      expect(deps.size).toBe(0);
    });
  });

  describe('getTokensByType', () => {
    it('should group tokens by type', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const grouped = result.current.getTokensByType(tokens);

      expect(grouped.get('color')).toHaveLength(2);
      expect(grouped.get('dimension')).toHaveLength(3);
    });
  });

  describe('getTokensByCollection', () => {
    it('should group tokens by collection', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      const grouped = result.current.getTokensByCollection(tokens);

      expect(grouped.get('colors')).toHaveLength(2);
      expect(grouped.get('spacing')).toHaveLength(2);
    });
  });

  describe('cache management', () => {
    it('should clear all caches', () => {
      const { result } = renderHook(() => useTokenCache());
      const tokens = createMockTokens();

      result.current.getFilteredTokens(tokens, { type: 'color' });
      result.current.getSortedTokens(tokens, { field: 'name', direction: 'asc' });

      result.current.clearCache();

      const stats = result.current.getCacheStats();
      expect(stats.filterCacheSize).toBe(0);
      expect(stats.sortCacheSize).toBe(0);
    });

    it('should provide cache statistics', () => {
      const { result } = renderHook(() => useTokenCache());

      const stats = result.current.getCacheStats();

      expect(stats).toHaveProperty('filterCacheSize');
      expect(stats).toHaveProperty('sortCacheSize');
      expect(stats).toHaveProperty('dependencyCacheSize');
      expect(stats).toHaveProperty('searchCacheSize');
    });
  });
});
