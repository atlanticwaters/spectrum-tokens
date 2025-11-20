import tokensReducer, {
  addToken,
  updateToken,
  deleteToken,
  selectToken,
  setEditingToken,
  loadTokens,
  setTokens,
  clearTokens,
  setLoading,
  setError,
  clearError,
  TokensState,
} from './tokensSlice';
import type { Token } from '../../components/tokens/types';

describe('tokensSlice', () => {
  const initialState: TokensState = {
    tokens: [],
    selectedToken: null,
    editingToken: null,
    isLoading: false,
    error: null,
  };

  const mockToken: Token = {
    name: 'primary-color',
    value: '#FF0000',
    type: 'color',
    description: 'Primary brand color',
  };

  const mockToken2: Token = {
    name: 'secondary-color',
    value: '#00FF00',
    type: 'color',
  };

  const mockToken3: Token = {
    name: 'spacing-sm',
    value: '8',
    type: 'spacing',
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      expect(tokensReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('addToken', () => {
    it('should add a token to empty array', () => {
      const actual = tokensReducer(initialState, addToken(mockToken));
      expect(actual.tokens).toHaveLength(1);
      expect(actual.tokens[0]).toEqual(mockToken);
      expect(actual.error).toBeNull();
    });

    it('should add a token to existing tokens', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const actual = tokensReducer(state, addToken(mockToken2));
      expect(actual.tokens).toHaveLength(2);
      expect(actual.tokens[1]).toEqual(mockToken2);
    });

    it('should clear error when adding token', () => {
      const state: TokensState = {
        ...initialState,
        error: 'Previous error',
      };
      const actual = tokensReducer(state, addToken(mockToken));
      expect(actual.error).toBeNull();
    });

    it('should add token with all optional fields', () => {
      const tokenWithOptionals: Token = {
        ...mockToken,
        styleId: 'style-123',
        variableId: 'var-456',
        collectionId: 'col-789',
      };
      const actual = tokensReducer(initialState, addToken(tokenWithOptionals));
      expect(actual.tokens[0]).toEqual(tokenWithOptionals);
    });
  });

  describe('updateToken', () => {
    it('should update an existing token', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const updates = { value: '#0000FF', description: 'Updated color' };
      const actual = tokensReducer(state, updateToken({ name: 'primary-color', updates }));
      expect(actual.tokens[0].value).toBe('#0000FF');
      expect(actual.tokens[0].description).toBe('Updated color');
      expect(actual.error).toBeNull();
    });

    it('should set error if token not found', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const actual = tokensReducer(state, updateToken({ name: 'nonexistent', updates: { value: '#000' } }));
      expect(actual.error).toBe('Token "nonexistent" not found');
      expect(actual.tokens).toEqual([mockToken]); // Unchanged
    });

    it('should update only specified fields', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const actual = tokensReducer(state, updateToken({ name: 'primary-color', updates: { value: '#AAAAAA' } }));
      expect(actual.tokens[0].value).toBe('#AAAAAA');
      expect(actual.tokens[0].description).toBe('Primary brand color'); // Unchanged
    });

    it('should handle multiple tokens and update correct one', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2, mockToken3],
      };
      const actual = tokensReducer(state, updateToken({ name: 'secondary-color', updates: { value: '#FFFF00' } }));
      expect(actual.tokens[0]).toEqual(mockToken); // Unchanged
      expect(actual.tokens[1].value).toBe('#FFFF00'); // Changed
      expect(actual.tokens[2]).toEqual(mockToken3); // Unchanged
    });
  });

  describe('deleteToken', () => {
    it('should delete a token by name', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2],
      };
      const actual = tokensReducer(state, deleteToken('primary-color'));
      expect(actual.tokens).toHaveLength(1);
      expect(actual.tokens[0]).toEqual(mockToken2);
      expect(actual.error).toBeNull();
    });

    it('should set error if token not found', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const actual = tokensReducer(state, deleteToken('nonexistent'));
      expect(actual.error).toBe('Token "nonexistent" not found');
      expect(actual.tokens).toEqual([mockToken]); // Unchanged
    });

    it('should clear selectedToken if deleting selected token', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2],
        selectedToken: mockToken,
      };
      const actual = tokensReducer(state, deleteToken('primary-color'));
      expect(actual.selectedToken).toBeNull();
    });

    it('should clear editingToken if deleting editing token', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2],
        editingToken: mockToken,
      };
      const actual = tokensReducer(state, deleteToken('primary-color'));
      expect(actual.editingToken).toBeNull();
    });

    it('should not clear selectedToken if deleting different token', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2],
        selectedToken: mockToken2,
      };
      const actual = tokensReducer(state, deleteToken('primary-color'));
      expect(actual.selectedToken).toEqual(mockToken2);
    });

    it('should handle deleting last token', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const actual = tokensReducer(state, deleteToken('primary-color'));
      expect(actual.tokens).toHaveLength(0);
    });
  });

  describe('selectToken', () => {
    it('should set selected token', () => {
      const actual = tokensReducer(initialState, selectToken(mockToken));
      expect(actual.selectedToken).toEqual(mockToken);
    });

    it('should change selected token', () => {
      const state: TokensState = {
        ...initialState,
        selectedToken: mockToken,
      };
      const actual = tokensReducer(state, selectToken(mockToken2));
      expect(actual.selectedToken).toEqual(mockToken2);
    });

    it('should clear selected token when passed null', () => {
      const state: TokensState = {
        ...initialState,
        selectedToken: mockToken,
      };
      const actual = tokensReducer(state, selectToken(null));
      expect(actual.selectedToken).toBeNull();
    });
  });

  describe('setEditingToken', () => {
    it('should set editing token', () => {
      const actual = tokensReducer(initialState, setEditingToken(mockToken));
      expect(actual.editingToken).toEqual(mockToken);
    });

    it('should change editing token', () => {
      const state: TokensState = {
        ...initialState,
        editingToken: mockToken,
      };
      const actual = tokensReducer(state, setEditingToken(mockToken2));
      expect(actual.editingToken).toEqual(mockToken2);
    });

    it('should clear editing token when passed null', () => {
      const state: TokensState = {
        ...initialState,
        editingToken: mockToken,
      };
      const actual = tokensReducer(state, setEditingToken(null));
      expect(actual.editingToken).toBeNull();
    });
  });

  describe('loadTokens', () => {
    it('should load tokens and set loading to false', () => {
      const state: TokensState = {
        ...initialState,
        isLoading: true,
      };
      const tokens = [mockToken, mockToken2, mockToken3];
      const actual = tokensReducer(state, loadTokens(tokens));
      expect(actual.tokens).toEqual(tokens);
      expect(actual.isLoading).toBe(false);
      expect(actual.error).toBeNull();
    });

    it('should replace existing tokens', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken],
      };
      const newTokens = [mockToken2, mockToken3];
      const actual = tokensReducer(state, loadTokens(newTokens));
      expect(actual.tokens).toEqual(newTokens);
    });

    it('should clear error when loading tokens', () => {
      const state: TokensState = {
        ...initialState,
        error: 'Previous error',
      };
      const actual = tokensReducer(state, loadTokens([mockToken]));
      expect(actual.error).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should set tokens', () => {
      const tokens = [mockToken, mockToken2];
      const actual = tokensReducer(initialState, setTokens(tokens));
      expect(actual.tokens).toEqual(tokens);
      expect(actual.error).toBeNull();
    });

    it('should replace existing tokens', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken3],
      };
      const newTokens = [mockToken, mockToken2];
      const actual = tokensReducer(state, setTokens(newTokens));
      expect(actual.tokens).toEqual(newTokens);
    });

    it('should clear tokens when passed empty array', () => {
      const state: TokensState = {
        ...initialState,
        tokens: [mockToken, mockToken2],
      };
      const actual = tokensReducer(state, setTokens([]));
      expect(actual.tokens).toHaveLength(0);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens and reset state', () => {
      const state: TokensState = {
        tokens: [mockToken, mockToken2],
        selectedToken: mockToken,
        editingToken: mockToken2,
        isLoading: true,
        error: 'Some error',
      };
      const actual = tokensReducer(state, clearTokens());
      expect(actual).toEqual(initialState);
    });

    it('should work on empty state', () => {
      const actual = tokensReducer(initialState, clearTokens());
      expect(actual).toEqual(initialState);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const actual = tokensReducer(initialState, setLoading(true));
      expect(actual.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state: TokensState = {
        ...initialState,
        isLoading: true,
      };
      const actual = tokensReducer(state, setLoading(false));
      expect(actual.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const actual = tokensReducer(initialState, setError('An error occurred'));
      expect(actual.error).toBe('An error occurred');
    });

    it('should replace existing error', () => {
      const state: TokensState = {
        ...initialState,
        error: 'Old error',
      };
      const actual = tokensReducer(state, setError('New error'));
      expect(actual.error).toBe('New error');
    });

    it('should set error to null', () => {
      const state: TokensState = {
        ...initialState,
        error: 'Some error',
      };
      const actual = tokensReducer(state, setError(null));
      expect(actual.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const state: TokensState = {
        ...initialState,
        error: 'Some error',
      };
      const actual = tokensReducer(state, clearError());
      expect(actual.error).toBeNull();
    });

    it('should work when error is already null', () => {
      const actual = tokensReducer(initialState, clearError());
      expect(actual.error).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple operations in sequence', () => {
      let state = initialState;

      // Add tokens
      state = tokensReducer(state, addToken(mockToken));
      state = tokensReducer(state, addToken(mockToken2));
      expect(state.tokens).toHaveLength(2);

      // Select a token
      state = tokensReducer(state, selectToken(mockToken));
      expect(state.selectedToken).toEqual(mockToken);

      // Update the selected token
      state = tokensReducer(state, updateToken({ name: 'primary-color', updates: { value: '#AAAAAA' } }));
      expect(state.tokens[0].value).toBe('#AAAAAA');

      // Delete the other token
      state = tokensReducer(state, deleteToken('secondary-color'));
      expect(state.tokens).toHaveLength(1);
      expect(state.selectedToken).toEqual(mockToken); // Still selected

      // Clear all
      state = tokensReducer(state, clearTokens());
      expect(state).toEqual(initialState);
    });

    it('should maintain data integrity when token has all fields', () => {
      const complexToken: Token = {
        name: 'complex-token',
        value: { r: 255, g: 0, b: 0, a: 1 },
        type: 'color',
        description: 'A complex token',
        styleId: 'style-123',
        variableId: 'var-456',
        collectionId: 'col-789',
      };

      let state = tokensReducer(initialState, addToken(complexToken));
      expect(state.tokens[0]).toEqual(complexToken);

      state = tokensReducer(state, updateToken({
        name: 'complex-token',
        updates: { description: 'Updated description' }
      }));
      expect(state.tokens[0].description).toBe('Updated description');
      expect(state.tokens[0].styleId).toBe('style-123'); // Preserved
      expect(state.tokens[0].variableId).toBe('var-456'); // Preserved
    });
  });
});
