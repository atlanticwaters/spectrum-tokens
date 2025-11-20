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

import {
  LRUCache,
  memoize,
  memoizeWith,
  debounce,
  throttle,
  once,
} from './memoization';

describe('LRUCache', () => {
  describe('basic operations', () => {
    it('should create a cache with default size', () => {
      const cache = new LRUCache<string, number>();
      expect(cache.size).toBe(0);
    });

    it('should create a cache with custom size', () => {
      const cache = new LRUCache<string, number>(50);
      expect(cache.size).toBe(0);
    });

    it('should set and get values', () => {
      const cache = new LRUCache<string, number>();
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for non-existent keys', () => {
      const cache = new LRUCache<string, number>();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const cache = new LRUCache<string, number>();
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should delete values', () => {
      const cache = new LRUCache<string, number>();
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.has('a')).toBe(false);
      expect(cache.delete('a')).toBe(false);
    });

    it('should clear all values', () => {
      const cache = new LRUCache<string, number>();
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.has('a')).toBe(false);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when full', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // Should evict 'a'

      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('should update access order on get', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // Make 'a' recently used
      cache.set('d', 4); // Should evict 'b'

      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
      expect(cache.has('c')).toBe(true);
      expect(cache.has('d')).toBe(true);
    });

    it('should update access order on set of existing key', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('a', 10); // Update 'a' - makes it recently used
      cache.set('d', 4); // Should evict 'b'

      expect(cache.get('a')).toBe(10);
      expect(cache.has('b')).toBe(false);
    });

    it('should maintain correct size limit', () => {
      const cache = new LRUCache<string, number>(5);

      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, i);
        expect(cache.size).toBeLessThanOrEqual(5);
      }

      expect(cache.size).toBe(5);
    });

    it('should handle size of 1', () => {
      const cache = new LRUCache<string, number>(1);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(1);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(true);
    });
  });

  describe('keys, values, entries', () => {
    it('should return all keys in order', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.keys()).toEqual(['a', 'b', 'c']);
    });

    it('should return all values in order', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.values()).toEqual([1, 2, 3]);
    });

    it('should return all entries in order', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.entries()).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    it('should reflect access order in keys', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.get('a'); // Move 'a' to end

      expect(cache.keys()).toEqual(['b', 'c', 'a']);
    });
  });

  describe('edge cases', () => {
    it('should enforce minimum size of 1', () => {
      const cache = new LRUCache<string, number>(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
    });

    it('should handle complex object keys', () => {
      const cache = new LRUCache<{ id: number }, string>(10);
      const key1 = { id: 1 };
      const key2 = { id: 2 };

      cache.set(key1, 'value1');
      cache.set(key2, 'value2');

      expect(cache.get(key1)).toBe('value1');
      expect(cache.get(key2)).toBe('value2');
    });

    it('should handle complex object values', () => {
      const cache = new LRUCache<string, { data: number[] }>(10);
      cache.set('a', { data: [1, 2, 3] });

      const result = cache.get('a');
      expect(result).toEqual({ data: [1, 2, 3] });
    });
  });
});

describe('memoize', () => {
  it('should cache function results', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle different arguments', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = memoize(fn);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(2, 3)).toBe(5);
    expect(memoized(1, 2)).toBe(3); // From cache
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect cache size limit', () => {
    const fn = jest.fn((x: number) => x * 2);
    const memoized = memoize(fn, 3);

    memoized(1);
    memoized(2);
    memoized(3);
    memoized(4); // Should evict memoized(1)

    expect(memoized.cache.size).toBe(3);
    expect(memoized.cache.has(JSON.stringify([1]))).toBe(false);
  });

  it('should expose clear method', () => {
    const fn = jest.fn((x: number) => x * 2);
    const memoized = memoize(fn);

    memoized(1);
    memoized(2);
    memoized.clear();

    expect(memoized.cache.size).toBe(0);
  });

  it('should handle functions with no arguments', () => {
    const fn = jest.fn(() => Math.random());
    const memoized = memoize(fn);

    const result1 = memoized();
    const result2 = memoized();

    expect(result1).toBe(result2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle functions returning objects', () => {
    const fn = jest.fn((id: number) => ({ id, name: `User ${id}` }));
    const memoized = memoize(fn);

    const result1 = memoized(1);
    const result2 = memoized(1);

    expect(result1).toBe(result2); // Same object reference
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should handle this context', () => {
    const obj = {
      multiplier: 2,
      multiply: memoize(function (this: any, x: number) {
        return x * this.multiplier;
      }),
    };

    expect(obj.multiply(5)).toBe(10);
    expect(obj.multiply(5)).toBe(10);
  });

  it('should handle complex arguments', () => {
    const fn = jest.fn((obj: { a: number; b: number }) => obj.a + obj.b);
    const memoized = memoize(fn);

    expect(memoized({ a: 1, b: 2 })).toBe(3);
    expect(memoized({ a: 1, b: 2 })).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('memoizeWith', () => {
  it('should use custom key generator', () => {
    const fn = jest.fn((user: { id: number; name: string }) => user.name.toUpperCase());
    const memoized = memoizeWith(fn, (user) => user.id.toString());

    const user1 = { id: 1, name: 'Alice' };
    const user2 = { id: 1, name: 'Bob' }; // Same ID, different name

    expect(memoized(user1)).toBe('ALICE');
    expect(memoized(user2)).toBe('ALICE'); // Cached by ID
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should differentiate by custom key', () => {
    const fn = jest.fn((user: { id: number; name: string }) => user.name);
    const memoized = memoizeWith(fn, (user) => user.id.toString());

    expect(memoized({ id: 1, name: 'Alice' })).toBe('Alice');
    expect(memoized({ id: 2, name: 'Bob' })).toBe('Bob');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect cache size', () => {
    const fn = jest.fn((x: { value: number }) => x.value * 2);
    const memoized = memoizeWith(fn, (x) => x.value.toString(), 2);

    memoized({ value: 1 });
    memoized({ value: 2 });
    memoized({ value: 3 }); // Should evict { value: 1 }

    expect(memoized.cache.size).toBe(2);
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should delay function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on subsequent calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to function', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1, 2, 3);
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith(1, 2, 3);
  });

  it('should cancel pending execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced.cancel();
    jest.advanceTimersByTime(100);

    expect(fn).not.toHaveBeenCalled();
  });

  it('should preserve this context', () => {
    const obj = {
      value: 42,
      getValue: debounce(function (this: any) {
        return this.value;
      }, 100),
    };

    obj.getValue();
    jest.advanceTimersByTime(100);
    // Context is preserved
  });
});

describe('throttle', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should execute immediately on first call', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throttle subsequent calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute after limit period', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    jest.advanceTimersByTime(50);
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to function', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled(1, 2, 3);
    expect(fn).toHaveBeenCalledWith(1, 2, 3);
  });

  it('should cancel pending execution', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    jest.advanceTimersByTime(50);
    throttled();
    throttled.cancel();
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('once', () => {
  it('should execute function only once', () => {
    const fn = jest.fn(() => 'result');
    const onceFn = once(fn);

    expect(onceFn()).toBe('result');
    expect(onceFn()).toBe('result');
    expect(onceFn()).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments on first call', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const onceFn = once(fn);

    expect(onceFn(1, 2)).toBe(3);
    expect(onceFn(3, 4)).toBe(3); // Still returns first result
    expect(fn).toHaveBeenCalledWith(1, 2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should preserve this context', () => {
    const obj = {
      value: 42,
      getValue: once(function (this: any) {
        return this.value;
      }),
    };

    expect(obj.getValue()).toBe(42);
    obj.value = 100;
    expect(obj.getValue()).toBe(42); // Still first result
  });

  it('should handle functions with no return value', () => {
    const fn = jest.fn();
    const onceFn = once(fn);

    onceFn();
    onceFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
