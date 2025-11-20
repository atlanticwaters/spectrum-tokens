/**
 * Tests for batch token operations
 */

import { configureStore } from '@reduxjs/toolkit';
import tokensReducer from '../store/slices/tokensSlice';
import {
  batchAddTokens,
  batchUpdateTokens,
  batchDeleteTokens,
  duplicateTokens,
} from './batchOperations';
import type { Token } from '../components/tokens/types';

// Helper to create a test store
function createTestStore(initialTokens: Token[] = []) {
  return configureStore({
    reducer: {
      tokens: tokensReducer,
    },
    preloadedState: {
      tokens: {
        tokens: initialTokens,
        selectedToken: null,
        editingToken: null,
        isLoading: false,
        error: null,
      },
    },
  });
}

describe('batchOperations', () => {
  describe('batchAddTokens', () => {
    it('adds multiple tokens successfully', async () => {
      const store = createTestStore();
      const tokensToAdd: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
        { name: 'token3', value: '16', type: 'spacing' },
      ];

      const result = await store.dispatch(batchAddTokens(tokensToAdd));

      expect(result.type).toBe('tokens/batchAdd/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(3);
      expect(state.tokens.tokens).toEqual(tokensToAdd);
    });

    it('filters out invalid tokens', async () => {
      const store = createTestStore();
      const tokensToAdd = [
        { name: 'valid-token', value: '#FF0000', type: 'color' },
        { name: '', value: '#00FF00', type: 'color' }, // Invalid: empty name
        { name: 'another-valid', value: '16', type: 'spacing' },
      ] as Token[];

      const result = await store.dispatch(batchAddTokens(tokensToAdd));

      expect(result.type).toBe('tokens/batchAdd/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(2);
      expect(state.tokens.tokens.map((t) => t.name)).toEqual(['valid-token', 'another-valid']);
    });

    it('rejects when no valid tokens provided', async () => {
      const store = createTestStore();
      const tokensToAdd = [
        { name: '', value: '#FF0000', type: 'color' }, // Invalid
      ] as Token[];

      const result = await store.dispatch(batchAddTokens(tokensToAdd));

      expect(result.type).toBe('tokens/batchAdd/rejected');
      const state = store.getState();
      expect(state.tokens.error).toBe('No valid tokens to add');
    });

    it('sets loading state during operation', async () => {
      const store = createTestStore();
      const tokensToAdd: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];

      const promise = store.dispatch(batchAddTokens(tokensToAdd));

      // Check loading state
      let state = store.getState();
      expect(state.tokens.isLoading).toBe(true);

      await promise;

      // Check loading state cleared
      state = store.getState();
      expect(state.tokens.isLoading).toBe(false);
    });

    it('handles empty array', async () => {
      const store = createTestStore();
      const result = await store.dispatch(batchAddTokens([]));

      expect(result.type).toBe('tokens/batchAdd/rejected');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(0);
    });
  });

  describe('batchUpdateTokens', () => {
    it('updates multiple tokens successfully', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
        { name: 'token3', value: '16', type: 'spacing' },
      ];
      const store = createTestStore(initialTokens);

      const updates = [
        { id: 'token1', changes: { value: '#0000FF' } },
        { id: 'token3', changes: { value: '32', description: 'Updated spacing' } },
      ];

      const result = await store.dispatch(batchUpdateTokens(updates));

      expect(result.type).toBe('tokens/batchUpdate/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens[0].value).toBe('#0000FF');
      expect(state.tokens.tokens[2].value).toBe('32');
      expect(state.tokens.tokens[2].description).toBe('Updated spacing');
    });

    it('ignores updates for non-existent tokens', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];
      const store = createTestStore(initialTokens);

      const updates = [
        { id: 'token1', changes: { value: '#0000FF' } },
        { id: 'nonexistent', changes: { value: '#00FF00' } },
      ];

      const result = await store.dispatch(batchUpdateTokens(updates));

      expect(result.type).toBe('tokens/batchUpdate/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].value).toBe('#0000FF');
    });

    it('filters out invalid updates', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];
      const store = createTestStore(initialTokens);

      const updates = [
        { id: '', changes: { value: '#0000FF' } }, // Invalid: empty id
        { id: 'token1', changes: { value: '#00FF00' } }, // Valid
      ];

      const result = await store.dispatch(batchUpdateTokens(updates));

      expect(result.type).toBe('tokens/batchUpdate/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens[0].value).toBe('#00FF00');
    });

    it('rejects when no valid updates provided', async () => {
      const store = createTestStore();
      const updates = [
        { id: '', changes: { value: '#0000FF' } },
      ];

      const result = await store.dispatch(batchUpdateTokens(updates));

      expect(result.type).toBe('tokens/batchUpdate/rejected');
      expect(result.payload).toBe('No valid updates to apply');
    });

    it('handles empty array', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];
      const store = createTestStore(initialTokens);

      const result = await store.dispatch(batchUpdateTokens([]));

      expect(result.type).toBe('tokens/batchUpdate/rejected');
      const state = store.getState();
      expect(state.tokens.tokens).toEqual(initialTokens);
    });
  });

  describe('batchDeleteTokens', () => {
    it('deletes multiple tokens successfully', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
        { name: 'token3', value: '16', type: 'spacing' },
      ];
      const store = createTestStore(initialTokens);

      const result = await store.dispatch(batchDeleteTokens(['token1', 'token3']));

      expect(result.type).toBe('tokens/batchDelete/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].name).toBe('token2');
    });

    it('ignores non-existent token IDs', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
      ];
      const store = createTestStore(initialTokens);

      const result = await store.dispatch(batchDeleteTokens(['token1', 'nonexistent']));

      expect(result.type).toBe('tokens/batchDelete/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(1);
      expect(state.tokens.tokens[0].name).toBe('token2');
    });

    it('clears selected token if deleted', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
      ];
      const store = configureStore({
        reducer: {
          tokens: tokensReducer,
        },
        preloadedState: {
          tokens: {
            tokens: initialTokens,
            selectedToken: initialTokens[0],
            editingToken: null,
            isLoading: false,
            error: null,
          },
        },
      });

      await store.dispatch(batchDeleteTokens(['token1']));

      const state = store.getState();
      expect(state.tokens.selectedToken).toBeNull();
    });

    it('clears editing token if deleted', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];
      const store = configureStore({
        reducer: {
          tokens: tokensReducer,
        },
        preloadedState: {
          tokens: {
            tokens: initialTokens,
            selectedToken: null,
            editingToken: initialTokens[0],
            isLoading: false,
            error: null,
          },
        },
      });

      await store.dispatch(batchDeleteTokens(['token1']));

      const state = store.getState();
      expect(state.tokens.editingToken).toBeNull();
    });

    it('rejects when no IDs provided', async () => {
      const store = createTestStore();
      const result = await store.dispatch(batchDeleteTokens([]));

      expect(result.type).toBe('tokens/batchDelete/rejected');
      expect(result.payload).toBe('No token IDs provided');
    });

    it('deletes all tokens when all IDs provided', async () => {
      const initialTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
        { name: 'token2', value: '#00FF00', type: 'color' },
      ];
      const store = createTestStore(initialTokens);

      await store.dispatch(batchDeleteTokens(['token1', 'token2']));

      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(0);
    });
  });

  describe('duplicateTokens', () => {
    it('duplicates tokens with default suffix', async () => {
      const originalTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color', description: 'Red' },
        { name: 'token2', value: '#00FF00', type: 'color', description: 'Green' },
      ];
      const store = createTestStore(originalTokens);

      const result = await store.dispatch(
        duplicateTokens({ tokens: originalTokens })
      );

      expect(result.type).toBe('tokens/duplicate/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(4);
      expect(state.tokens.tokens[2].name).toBe('token1 (copy)');
      expect(state.tokens.tokens[2].value).toBe('#FF0000');
      expect(state.tokens.tokens[3].name).toBe('token2 (copy)');
    });

    it('duplicates tokens with custom suffix', async () => {
      const originalTokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];
      const store = createTestStore(originalTokens);

      const result = await store.dispatch(
        duplicateTokens({ tokens: originalTokens, suffix: ' - duplicate' })
      );

      expect(result.type).toBe('tokens/duplicate/fulfilled');
      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(2);
      expect(state.tokens.tokens[1].name).toBe('token1 - duplicate');
    });

    it('preserves all token properties', async () => {
      const originalTokens: Token[] = [
        {
          name: 'token1',
          value: '#FF0000',
          type: 'color',
          description: 'Primary color',
          styleId: 'style-123',
          variableId: 'var-456',
        },
      ];
      const store = createTestStore(originalTokens);

      await store.dispatch(duplicateTokens({ tokens: originalTokens }));

      const state = store.getState();
      const duplicate = state.tokens.tokens[1];
      expect(duplicate.value).toBe('#FF0000');
      expect(duplicate.type).toBe('color');
      expect(duplicate.description).toBe('Primary color');
      expect(duplicate.styleId).toBe('style-123');
      expect(duplicate.variableId).toBe('var-456');
    });

    it('rejects when no tokens provided', async () => {
      const store = createTestStore();
      const result = await store.dispatch(
        duplicateTokens({ tokens: [] })
      );

      expect(result.type).toBe('tokens/duplicate/rejected');
      expect(result.payload).toBe('No tokens to duplicate');
    });

    it('handles duplicate single token', async () => {
      const originalTokens: Token[] = [
        { name: 'only-token', value: '16', type: 'spacing' },
      ];
      const store = createTestStore(originalTokens);

      await store.dispatch(
        duplicateTokens({ tokens: [originalTokens[0]] })
      );

      const state = store.getState();
      expect(state.tokens.tokens).toHaveLength(2);
      expect(state.tokens.tokens[0].name).toBe('only-token');
      expect(state.tokens.tokens[1].name).toBe('only-token (copy)');
    });
  });

  describe('async behavior', () => {
    it('maintains loading state across operations', async () => {
      const store = createTestStore();
      const tokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];

      // Start operation
      const promise1 = store.dispatch(batchAddTokens(tokens));
      expect(store.getState().tokens.isLoading).toBe(true);

      await promise1;
      expect(store.getState().tokens.isLoading).toBe(false);

      // Start another operation
      const promise2 = store.dispatch(batchDeleteTokens(['token1']));
      expect(store.getState().tokens.isLoading).toBe(true);

      await promise2;
      expect(store.getState().tokens.isLoading).toBe(false);
    });

    it('clears errors on successful operation', async () => {
      const store = configureStore({
        reducer: {
          tokens: tokensReducer,
        },
        preloadedState: {
          tokens: {
            tokens: [],
            selectedToken: null,
            editingToken: null,
            isLoading: false,
            error: 'Previous error',
          },
        },
      });

      const tokens: Token[] = [
        { name: 'token1', value: '#FF0000', type: 'color' },
      ];

      await store.dispatch(batchAddTokens(tokens));

      const state = store.getState();
      expect(state.tokens.error).toBeNull();
    });
  });
});
