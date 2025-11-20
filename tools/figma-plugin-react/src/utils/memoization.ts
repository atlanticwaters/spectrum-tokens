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

/**
 * LRU (Least Recently Used) Cache implementation
 *
 * Maintains a fixed-size cache where least recently used items are evicted
 * when the cache reaches its maximum size.
 *
 * @example
 * const cache = new LRUCache<string, number>(3);
 * cache.set('a', 1);
 * cache.set('b', 2);
 * cache.get('a'); // Returns 1
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  /**
   * Create a new LRU cache
   * @param maxSize - Maximum number of items to store
   */
  constructor(maxSize: number = 100) {
    this.maxSize = Math.max(1, maxSize);
    this.cache = new Map();
  }

  /**
   * Get an item from the cache
   * @param key - The key to look up
   * @returns The cached value or undefined
   */
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  /**
   * Set an item in the cache
   * @param key - The key to store under
   * @param value - The value to store
   */
  set(key: K, value: V): void {
    // Delete if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new item
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key - The key to check
   * @returns True if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete an item from the cache
   * @param key - The key to delete
   * @returns True if the key was deleted
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache
   * @returns Number of items in cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in the cache (most recent last)
   * @returns Array of keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache (most recent last)
   * @returns Array of values
   */
  values(): V[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get all entries in the cache (most recent last)
   * @returns Array of [key, value] tuples
   */
  entries(): [K, V][] {
    return Array.from(this.cache.entries());
  }
}

/**
 * Create a cache key from function arguments
 * @param args - Function arguments
 * @returns String cache key
 */
function createCacheKey(args: any[]): string {
  return JSON.stringify(args);
}

/**
 * Memoize a function with LRU cache
 *
 * Caches function results based on arguments. Uses LRU eviction
 * when cache reaches maximum size.
 *
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size (default: 100)
 * @returns Memoized function
 *
 * @example
 * const expensiveOperation = (a: number, b: number) => {
 *   console.log('Computing...');
 *   return a + b;
 * };
 *
 * const memoized = memoize(expensiveOperation, 50);
 * memoized(1, 2); // Logs "Computing..." and returns 3
 * memoized(1, 2); // Returns 3 from cache (no log)
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100
): T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void } {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = createCacheKey(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void };

  // Expose cache for testing/debugging
  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Memoize a function with custom key generator
 *
 * @param fn - Function to memoize
 * @param keyGenerator - Function to generate cache key from arguments
 * @param maxSize - Maximum cache size (default: 100)
 * @returns Memoized function
 *
 * @example
 * const getUserById = (user: { id: number; name: string }) => {
 *   return `User: ${user.name}`;
 * };
 *
 * const memoized = memoizeWith(
 *   getUserById,
 *   (user) => user.id.toString(),
 *   50
 * );
 */
export function memoizeWith<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  maxSize: number = 100
): T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void } {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);

  const memoized = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T & { cache: LRUCache<string, ReturnType<T>>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Debounce a function call
 *
 * Delays execution until after the specified wait time has elapsed
 * since the last call.
 *
 * @param fn - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function
 *
 * @example
 * const handleSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 *
 * handleSearch('a'); // Won't execute
 * handleSearch('ab'); // Won't execute
 * handleSearch('abc'); // Executes after 300ms
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, wait);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle a function call
 *
 * Ensures function is called at most once per specified time period.
 *
 * @param fn - Function to throttle
 * @param limit - Milliseconds between calls
 * @returns Throttled function
 *
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 *
 * window.addEventListener('scroll', handleScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Schedule a call at the end of the limit period
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, limit - (now - lastCall));
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * Once - execute a function only once
 *
 * @param fn - Function to execute once
 * @returns Function that can be called multiple times but only executes once
 *
 * @example
 * const initialize = once(() => {
 *   console.log('Initializing...');
 * });
 *
 * initialize(); // Logs "Initializing..."
 * initialize(); // Does nothing
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  } as T;
}
