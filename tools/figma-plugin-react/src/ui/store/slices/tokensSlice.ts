import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Token } from '../../components/tokens/types';
import {
  batchAddTokens,
  batchUpdateTokens,
  batchDeleteTokens,
  duplicateTokens,
} from '../../operations/batchOperations';

export interface TokensState {
  tokens: Token[];
  selectedToken: Token | null;
  editingToken: Token | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TokensState = {
  tokens: [],
  selectedToken: null,
  editingToken: null,
  isLoading: false,
  error: null,
};

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    // Token CRUD operations
    addToken: (state, action: PayloadAction<Token>) => {
      state.tokens.push(action.payload);
      state.error = null;
    },

    updateToken: (state, action: PayloadAction<{ name: string; updates: Partial<Token> }>) => {
      const index = state.tokens.findIndex(t => t.name === action.payload.name);
      if (index !== -1) {
        state.tokens[index] = { ...state.tokens[index], ...action.payload.updates };
        state.error = null;
      } else {
        state.error = `Token "${action.payload.name}" not found`;
      }
    },

    deleteToken: (state, action: PayloadAction<string>) => {
      const index = state.tokens.findIndex(t => t.name === action.payload);
      if (index !== -1) {
        state.tokens.splice(index, 1);
        // Clear selected/editing if we just deleted that token
        if (state.selectedToken?.name === action.payload) {
          state.selectedToken = null;
        }
        if (state.editingToken?.name === action.payload) {
          state.editingToken = null;
        }
        state.error = null;
      } else {
        state.error = `Token "${action.payload}" not found`;
      }
    },

    // Selection management
    selectToken: (state, action: PayloadAction<Token | null>) => {
      state.selectedToken = action.payload;
    },

    setEditingToken: (state, action: PayloadAction<Token | null>) => {
      state.editingToken = action.payload;
    },

    // Batch operations
    loadTokens: (state, action: PayloadAction<Token[]>) => {
      state.tokens = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    setTokens: (state, action: PayloadAction<Token[]>) => {
      state.tokens = action.payload;
      state.error = null;
    },

    clearTokens: (state) => {
      state.tokens = [];
      state.selectedToken = null;
      state.editingToken = null;
      state.isLoading = false;
      state.error = null;
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Batch add tokens
    builder
      .addCase(batchAddTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(batchAddTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens.push(...action.payload);
      })
      .addCase(batchAddTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Batch update tokens
    builder
      .addCase(batchUpdateTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(batchUpdateTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        action.payload.forEach(({ id, changes }) => {
          const index = state.tokens.findIndex((t) => t.name === id);
          if (index !== -1) {
            state.tokens[index] = { ...state.tokens[index], ...changes };
          }
        });
      })
      .addCase(batchUpdateTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Batch delete tokens
    builder
      .addCase(batchDeleteTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(batchDeleteTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens = state.tokens.filter((t) => !action.payload.includes(t.name));
        // Clear selected/editing if deleted
        if (state.selectedToken && action.payload.includes(state.selectedToken.name)) {
          state.selectedToken = null;
        }
        if (state.editingToken && action.payload.includes(state.editingToken.name)) {
          state.editingToken = null;
        }
      })
      .addCase(batchDeleteTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Duplicate tokens
    builder
      .addCase(duplicateTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(duplicateTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokens.push(...action.payload);
      })
      .addCase(duplicateTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
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
} = tokensSlice.actions;

export default tokensSlice.reducer;
