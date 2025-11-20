import { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { recordAction } from '../slices/historySlice';

/**
 * Middleware to automatically record undoable actions
 *
 * This middleware intercepts token-related actions and records them
 * in the history slice for undo/redo functionality.
 */

// Actions that should be recorded in history
const UNDOABLE_ACTIONS = [
  'tokens/addToken',
  'tokens/updateToken',
  'tokens/deleteToken',
  'tokens/setTokens',
  'tokens/clearTokens',
  'tokens/batchAddTokens/fulfilled',
  'tokens/batchUpdateTokens/fulfilled',
  'tokens/batchDeleteTokens/fulfilled',
  'tokens/duplicateTokens/fulfilled',
];

// Map of action types to human-readable descriptions
const ACTION_DESCRIPTIONS: Record<string, (payload: any) => string> = {
  'tokens/addToken': (payload) => `Added token: ${payload.name}`,
  'tokens/updateToken': (payload) => `Updated token: ${payload.name}`,
  'tokens/deleteToken': (payload) => `Deleted token: ${payload}`,
  'tokens/setTokens': () => `Loaded tokens`,
  'tokens/clearTokens': () => `Cleared all tokens`,
  'tokens/batchAddTokens/fulfilled': (payload) => `Added ${payload.length} tokens`,
  'tokens/batchUpdateTokens/fulfilled': (payload) => `Updated ${payload.length} tokens`,
  'tokens/batchDeleteTokens/fulfilled': (payload) => `Deleted ${payload.length} tokens`,
  'tokens/duplicateTokens/fulfilled': (payload) => `Duplicated ${payload.length} tokens`,
};

/**
 * History middleware
 *
 * Records token state changes in history for undo/redo
 */
export const historyMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Get state before action
  const stateBefore = store.getState().tokens;

  // Execute action
  const result = next(action);

  // Get state after action
  const stateAfter = store.getState().tokens;

  // Check if this is an undoable action
  if (UNDOABLE_ACTIONS.includes(action.type)) {
    // Only record if state actually changed
    if (JSON.stringify(stateBefore) !== JSON.stringify(stateAfter)) {
      const descriptionFn = ACTION_DESCRIPTIONS[action.type];
      const description = descriptionFn ? descriptionFn(action.payload) : action.type;

      // Record in history
      store.dispatch(
        recordAction({
          state: stateAfter,
          description,
        })
      );
    }
  }

  return result;
};
