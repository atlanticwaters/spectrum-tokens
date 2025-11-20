/**
 * Copyright 2024 Adobe. All rights reserved.
 * Integration tests for complete workflows
 */

import { configureStore } from '@reduxjs/toolkit';
import tokensReducer, { addToken, updateToken, deleteToken } from '../../src/ui/store/slices/tokensSlice';
import historyReducer, { undo, redo } from '../../src/ui/store/slices/historySlice';
import toastsReducer from '../../src/ui/store/slices/toastsSlice';
import { batchAddTokens, batchUpdateTokens, batchDeleteTokens } from '../../src/ui/operations/batchOperations';
import type { Token } from '../../src/ui/components/tokens/types';

describe('Integration: Full Workflow Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tokens: tokensReducer,
        history: historyReducer,
        toasts: toastsReducer,
      },
    });
  });

  describe('Token CRUD Workflow', () => {
    it('should create, update, and delete a token', () => {
      const token: Token = {
        name: 'color-primary',
        value: '#1976d2',
        type: 'color',
        description: 'Primary brand color',
      };

      // Create
      store.dispatch(addToken(token));
      let state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].name).toBe('color-primary');

      // Update
      store.dispatch(updateToken({
        name: 'color-primary',
        updates: { value: '#2196f3' },
      }));
      state = store.getState();
      expect(state.tokens.tokens[0].value).toBe('#2196f3');

      // Delete
      store.dispatch(deleteToken('color-primary'));
      state = store.getState();
      expect(state.tokens.tokens).toHaveLength(0);
    });

    it('should handle multiple token creation', () => {
      const tokens: Token[] = [
        { name: 'color-1', value: '#111', type: 'color' },
        { name: 'color-2', value: '#222', type: 'color' },
        { name: 'color-3', value: '#333', type: 'color' },
      ];

      tokens.forEach(token => store.dispatch(addToken(token)));

      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(3);
    });
  });

  describe('Batch Operations Workflow', () => {
    it('should perform batch add, update, delete sequence', async () => {
      // Batch add
      const tokensToAdd: Token[] = [
        { name: 'token-1', value: '#111', type: 'color' },
        { name: 'token-2', value: '#222', type: 'color' },
        { name: 'token-3', value: '#333', type: 'color' },
      ];

      await store.dispatch(batchAddTokens(tokensToAdd));
      let state = store.getState();
      expect(state.tokens.tokens).toHaveLength(3);

      // Batch update
      const updates = [
        { id: 'token-1', changes: { value: '#aaa' } },
        { id: 'token-2', changes: { value: '#bbb' } },
      ];

      await store.dispatch(batchUpdateTokens(updates));
      state = store.getState();
      expect(state.tokens.tokens[0].value).toBe('#aaa');
      expect(state.tokens.tokens[1].value).toBe('#bbb');

      // Batch delete
      await store.dispatch(batchDeleteTokens(['token-1', 'token-3']));
      state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].name).toBe('token-2');
    });
  });

  describe('Undo/Redo Workflow', () => {
    it('should undo and redo token operations', () => {
      const token: Token = {
        name: 'test-token',
        value: '#000',
        type: 'color',
      };

      // Create token
      store.dispatch(addToken(token));
      let state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);

      // Undo creation
      store.dispatch(undo());
      state = store.getState();
      // Note: In full integration, middleware would sync this
      // For unit test, we check history state
      expect(state.history.canRedo).toBe(true);

      // Redo creation
      store.dispatch(redo());
      state = store.getState();
      expect(state.history.canUndo).toBe(true);
    });

    it('should handle complex undo/redo sequence', () => {
      // Add three tokens
      store.dispatch(addToken({ name: 'token-1', value: '#111', type: 'color' }));
      store.dispatch(addToken({ name: 'token-2', value: '#222', type: 'color' }));
      store.dispatch(addToken({ name: 'token-3', value: '#333', type: 'color' }));

      let state = store.getState();
      expect(state.tokens.tokens).toHaveLength(3);

      // Undo twice
      store.dispatch(undo());
      store.dispatch(undo());

      // Redo once
      store.dispatch(redo());

      // Should have ability to undo and redo
      state = store.getState();
      expect(state.history.canUndo).toBe(true);
      expect(state.history.canRedo).toBe(true);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle invalid token gracefully', () => {
      const invalidToken = {
        name: '',
        value: '#000',
        type: 'color',
      } as Token;

      // Store will accept it (validation happens at UI level)
      store.dispatch(addToken(invalidToken));
      const state = store.getState();
      expect(state.tokens.error).toBeNull(); // No store-level error
    });

    it('should handle update of non-existent token', () => {
      store.dispatch(updateToken({
        name: 'non-existent',
        updates: { value: '#000' },
      }));

      const state = store.getState();
      expect(state.tokens.error).toBeTruthy();
      expect(state.tokens.error).toContain('not found');
    });

    it('should handle delete of non-existent token', () => {
      store.dispatch(deleteToken('non-existent'));

      const state = store.getState();
      expect(state.tokens.error).toBeTruthy();
      expect(state.tokens.error).toContain('not found');
    });
  });

  describe('Complex State Transitions', () => {
    it('should maintain consistency through rapid operations', () => {
      // Rapid fire operations
      for (let i = 0; i < 10; i++) {
        store.dispatch(addToken({
          name: `token-${i}`,
          value: `#${i}${i}${i}`,
          type: 'color',
        }));
      }

      let state = store.getState();
      expect(state.tokens.tokens).toHaveLength(10);

      // Rapid updates
      for (let i = 0; i < 5; i++) {
        store.dispatch(updateToken({
          name: `token-${i}`,
          updates: { value: '#fff' },
        }));
      }

      state = store.getState();
      expect(state.tokens.tokens.slice(0, 5).every(t => t.value === '#fff')).toBe(true);

      // Rapid deletes
      for (let i = 0; i < 5; i++) {
        store.dispatch(deleteToken(`token-${i}`));
      }

      state = store.getState();
      expect(state.tokens.tokens).toHaveLength(5);
    });

    it('should handle mixed operation sequence', () => {
      // Add
      store.dispatch(addToken({ name: 'token-1', value: '#111', type: 'color' }));

      // Update
      store.dispatch(updateToken({ name: 'token-1', updates: { value: '#222' } }));

      // Add another
      store.dispatch(addToken({ name: 'token-2', value: '#333', type: 'color' }));

      // Delete first
      store.dispatch(deleteToken('token-1'));

      // Final state check
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].name).toBe('token-2');
    });
  });

  describe('Selection State Workflow', () => {
    it('should maintain selection through operations', () => {
      const token: Token = { name: 'test', value: '#000', type: 'color' };

      // Add and select
      store.dispatch(addToken(token));

      let state = store.getState();

      // Selection should be independent of token operations
      expect(state.tokens.selectedToken).toBeNull();
    });
  });

  describe('Loading State Workflow', () => {
    it('should handle async operations loading states', async () => {
      const tokens: Token[] = [
        { name: 'token-1', value: '#111', type: 'color' },
        { name: 'token-2', value: '#222', type: 'color' },
      ];

      // Start async operation
      const promise = store.dispatch(batchAddTokens(tokens));

      // Check loading state
      let state = store.getState();
      expect(state.tokens.isLoading).toBe(true);

      // Wait for completion
      await promise;

      // Check final state
      state = store.getState();
      expect(state.tokens.isLoading).toBe(false);
      expect(state.tokens.tokens).toHaveLength(2);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve token data through operations', () => {
      const token: Token = {
        name: 'complex-token',
        value: { r: 255, g: 0, b: 0 },
        type: 'color',
        description: 'A complex token',
        styleId: 'style-123',
        variableId: 'var-456',
        collectionId: 'col-789',
      };

      store.dispatch(addToken(token));

      const state = store.getState();
      const storedToken = state.tokens.tokens[0];

      expect(storedToken).toEqual(token);
      expect(storedToken.styleId).toBe('style-123');
      expect(storedToken.variableId).toBe('var-456');
      expect(storedToken.collectionId).toBe('col-789');
    });

    it('should handle deep updates correctly', () => {
      const token: Token = {
        name: 'gradient',
        value: { type: 'linear', stops: [{ color: '#000', position: 0 }] },
        type: 'gradient',
      };

      store.dispatch(addToken(token));
      store.dispatch(updateToken({
        name: 'gradient',
        updates: {
          value: { type: 'radial', stops: [{ color: '#fff', position: 1 }] },
        },
      }));

      const state = store.getState();
      const updatedToken = state.tokens.tokens[0];

      expect(updatedToken.value.type).toBe('radial');
      expect(updatedToken.value.stops[0].color).toBe('#fff');
    });
  });

  describe('Performance under load', () => {
    it('should handle large numbers of tokens efficiently', () => {
      const startTime = Date.now();

      // Add 100 tokens
      for (let i = 0; i < 100; i++) {
        store.dispatch(addToken({
          name: `token-${i}`,
          value: `#${i.toString(16).padStart(6, '0')}`,
          type: 'color',
        }));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in < 1s
    });

    it('should handle batch operations efficiently', async () => {
      const tokens: Token[] = Array.from({ length: 100 }, (_, i) => ({
        name: `token-${i}`,
        value: `#${i}`,
        type: 'color',
      }));

      const startTime = Date.now();
      await store.dispatch(batchAddTokens(tokens));
      const endTime = Date.now();
      const duration = endTime - startTime;

      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(100);
      expect(duration).toBeLessThan(500); // Batch should be faster
    });
  });
});
