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

import { useMemo, useRef } from 'react';
import type { Token } from '../components/tokens/types';
import { LRUCache } from '../../utils/memoization';

/**
 * Filter options for tokens
 */
export interface TokenFilterOptions {
  /** Filter by token type */
  type?: string;
  /** Filter by search query (name or value) */
  search?: string;
  /** Filter by collection ID */
  collectionId?: string;
}

/**
 * Sort options for tokens
 */
export interface TokenSortOptions {
  /** Field to sort by */
  field: 'name' | 'type' | 'value';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Hook for caching computed token values
 *
 * Provides memoized versions of expensive token operations like
 * filtering, sorting, and dependency analysis.
 *
 * @example
 * const { getFilteredTokens, getSortedTokens, clearCache } = useTokenCache();
 *
 * const filtered = getFilteredTokens(tokens, { type: 'color' });
 * const sorted = getSortedTokens(filtered, { field: 'name', direction: 'asc' });
 */
export function useTokenCache() {
  // Persistent caches across re-renders
  const filterCache = useRef(new LRUCache<string, Token[]>(100));
  const sortCache = useRef(new LRUCache<string, Token[]>(100));
  const dependencyCache = useRef(new LRUCache<string, Set<string>>(100));
  const searchCache = useRef(new LRUCache<string, Token[]>(50));

  /**
   * Get filtered tokens with caching
   */
  const getFilteredTokens = useMemo(() => {
    return (tokens: Token[], options: TokenFilterOptions): Token[] => {
      const cacheKey = JSON.stringify({ tokens: tokens.map(t => t.name), options });

      if (filterCache.current.has(cacheKey)) {
        return filterCache.current.get(cacheKey)!;
      }

      let filtered = [...tokens];

      // Filter by type
      if (options.type) {
        filtered = filtered.filter((t) => t.type === options.type);
      }

      // Filter by collection
      if (options.collectionId) {
        filtered = filtered.filter((t) => t.collectionId === options.collectionId);
      }

      // Filter by search query
      if (options.search) {
        const query = options.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.name.toLowerCase().includes(query) ||
            String(t.value).toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query)
        );
      }

      filterCache.current.set(cacheKey, filtered);
      return filtered;
    };
  }, []);

  /**
   * Get sorted tokens with caching
   */
  const getSortedTokens = useMemo(() => {
    return (tokens: Token[], options: TokenSortOptions): Token[] => {
      const cacheKey = JSON.stringify({ tokens: tokens.map(t => t.name), options });

      if (sortCache.current.has(cacheKey)) {
        return sortCache.current.get(cacheKey)!;
      }

      const sorted = [...tokens].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (options.field) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'value':
            aValue = String(a.value);
            bValue = String(b.value);
            break;
        }

        if (aValue < bValue) {
          return options.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return options.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      sortCache.current.set(cacheKey, sorted);
      return sorted;
    };
  }, []);

  /**
   * Get token dependencies (tokens that reference this token)
   */
  const getTokenDependencies = useMemo(() => {
    return (tokens: Token[], tokenName: string): Set<string> => {
      const cacheKey = JSON.stringify({
        tokens: tokens.map(t => t.name),
        tokenName,
      });

      if (dependencyCache.current.has(cacheKey)) {
        return dependencyCache.current.get(cacheKey)!;
      }

      const dependencies = new Set<string>();

      tokens.forEach((token) => {
        // Check if token value references the target token
        const valueStr = String(token.value);
        if (valueStr.includes(`{${tokenName}}`) || valueStr.includes(tokenName)) {
          dependencies.add(token.name);
        }
      });

      dependencyCache.current.set(cacheKey, dependencies);
      return dependencies;
    };
  }, []);

  /**
   * Search tokens with caching (fuzzy search)
   */
  const searchTokens = useMemo(() => {
    return (tokens: Token[], query: string): Token[] => {
      if (!query.trim()) {
        return tokens;
      }

      const cacheKey = JSON.stringify({
        tokens: tokens.map(t => t.name),
        query,
      });

      if (searchCache.current.has(cacheKey)) {
        return searchCache.current.get(cacheKey)!;
      }

      const queryLower = query.toLowerCase();
      const results = tokens.filter((token) => {
        // Exact name match (highest priority)
        if (token.name.toLowerCase() === queryLower) {
          return true;
        }

        // Name starts with query
        if (token.name.toLowerCase().startsWith(queryLower)) {
          return true;
        }

        // Name contains query
        if (token.name.toLowerCase().includes(queryLower)) {
          return true;
        }

        // Value contains query
        if (String(token.value).toLowerCase().includes(queryLower)) {
          return true;
        }

        // Description contains query
        if (token.description?.toLowerCase().includes(queryLower)) {
          return true;
        }

        return false;
      });

      searchCache.current.set(cacheKey, results);
      return results;
    };
  }, []);

  /**
   * Get tokens grouped by type
   */
  const getTokensByType = useMemo(() => {
    return (tokens: Token[]): Map<string, Token[]> => {
      const grouped = new Map<string, Token[]>();

      tokens.forEach((token) => {
        const type = token.type;
        if (!grouped.has(type)) {
          grouped.set(type, []);
        }
        grouped.get(type)!.push(token);
      });

      return grouped;
    };
  }, []);

  /**
   * Get tokens grouped by collection
   */
  const getTokensByCollection = useMemo(() => {
    return (tokens: Token[]): Map<string, Token[]> => {
      const grouped = new Map<string, Token[]>();

      tokens.forEach((token) => {
        const collectionId = token.collectionId || 'default';
        if (!grouped.has(collectionId)) {
          grouped.set(collectionId, []);
        }
        grouped.get(collectionId)!.push(token);
      });

      return grouped;
    };
  }, []);

  /**
   * Clear all caches
   */
  const clearCache = useMemo(() => {
    return () => {
      filterCache.current.clear();
      sortCache.current.clear();
      dependencyCache.current.clear();
      searchCache.current.clear();
    };
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useMemo(() => {
    return () => ({
      filterCacheSize: filterCache.current.size,
      sortCacheSize: sortCache.current.size,
      dependencyCacheSize: dependencyCache.current.size,
      searchCacheSize: searchCache.current.size,
    });
  }, []);

  return {
    getFilteredTokens,
    getSortedTokens,
    getTokenDependencies,
    searchTokens,
    getTokensByType,
    getTokensByCollection,
    clearCache,
    getCacheStats,
  };
}
