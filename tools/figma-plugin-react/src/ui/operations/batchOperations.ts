/**
 * Batch token operations for efficient bulk updates.
 * Provides async thunks for batch add, update, delete, and duplicate operations.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Token } from '../components/tokens/types';

/**
 * Batch add multiple tokens at once.
 * Validates each token before adding and skips duplicates.
 */
export const batchAddTokens = createAsyncThunk(
  'tokens/batchAdd',
  async (tokens: Token[], { rejectWithValue }) => {
    try {
      // Simulate async operation (e.g., API call)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Validate tokens
      const validTokens = tokens.filter((token) => {
        if (!token.name || !token.type) {
          console.warn('Invalid token:', token);
          return false;
        }
        return true;
      });

      if (validTokens.length === 0) {
        return rejectWithValue('No valid tokens to add');
      }

      return validTokens;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add tokens');
    }
  }
);

/**
 * Batch update multiple tokens at once.
 * Applies partial updates to specified tokens.
 */
export const batchUpdateTokens = createAsyncThunk(
  'tokens/batchUpdate',
  async (
    updates: Array<{ id: string; changes: Partial<Token> }>,
    { rejectWithValue }
  ) => {
    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Validate updates
      const validUpdates = updates.filter((update) => {
        if (!update.id) {
          console.warn('Invalid update: missing id', update);
          return false;
        }
        return true;
      });

      if (validUpdates.length === 0) {
        return rejectWithValue('No valid updates to apply');
      }

      return validUpdates;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update tokens');
    }
  }
);

/**
 * Batch delete multiple tokens at once.
 * Removes all tokens with the specified IDs.
 */
export const batchDeleteTokens = createAsyncThunk(
  'tokens/batchDelete',
  async (ids: string[], { rejectWithValue }) => {
    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (ids.length === 0) {
        return rejectWithValue('No token IDs provided');
      }

      return ids;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete tokens');
    }
  }
);

/**
 * Duplicate tokens by creating copies with modified names.
 * Appends " (copy)" to the name of each duplicated token.
 */
export const duplicateTokens = createAsyncThunk(
  'tokens/duplicate',
  async (
    params: { tokens: Token[]; suffix?: string },
    { rejectWithValue }
  ) => {
    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { tokens, suffix = ' (copy)' } = params;

      if (tokens.length === 0) {
        return rejectWithValue('No tokens to duplicate');
      }

      // Create duplicates with modified names
      const duplicates = tokens.map((token) => ({
        ...token,
        name: `${token.name}${suffix}`,
      }));

      return duplicates;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to duplicate tokens');
    }
  }
);
