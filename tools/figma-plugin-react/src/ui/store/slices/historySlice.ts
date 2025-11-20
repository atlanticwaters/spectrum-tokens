import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TokensState } from './tokensSlice';

/**
 * History state for undo/redo functionality
 * Maintains snapshots of token state for time-travel debugging
 */
export interface HistoryState {
  /** Stack of previous states */
  past: TokensState[];
  /** Current state */
  present: TokensState | null;
  /** Stack of future states (for redo) */
  future: TokensState[];
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Maximum number of states to keep in history */
  maxHistorySize: number;
  /** Description of the last action (for toast messages) */
  lastActionDescription: string | null;
}

const initialState: HistoryState = {
  past: [],
  present: null,
  future: [],
  canUndo: false,
  canRedo: false,
  maxHistorySize: 50,
  lastActionDescription: null,
};

/**
 * Creates a deep copy of a state object
 */
function cloneState(state: TokensState): TokensState {
  return JSON.parse(JSON.stringify(state));
}

/**
 * History slice for managing undo/redo functionality
 * Tracks token state changes and allows time-travel through history
 */
const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    /**
     * Records a new action in history
     * Saves the current state to the past stack
     */
    recordAction: (
      state,
      action: PayloadAction<{
        state: TokensState;
        description: string;
      }>
    ) => {
      // If we have a present state, push it to past
      if (state.present) {
        state.past.push(cloneState(state.present));

        // Limit past history size
        if (state.past.length > state.maxHistorySize) {
          state.past.shift();
        }
      }

      // Set new present state
      state.present = cloneState(action.payload.state);

      // Clear future (any new action invalidates redo)
      state.future = [];

      // Update action description
      state.lastActionDescription = action.payload.description;

      // Update flags
      state.canUndo = state.past.length > 0;
      state.canRedo = false;
    },

    /**
     * Undo the last action
     * Restores the previous state from history
     */
    undo: (state) => {
      if (state.past.length === 0 || !state.present) {
        return;
      }

      // Move present to future
      state.future.unshift(cloneState(state.present));

      // Pop last state from past and make it present
      const previous = state.past.pop();
      if (previous) {
        state.present = previous;
      }

      // Update flags
      state.canUndo = state.past.length > 0;
      state.canRedo = state.future.length > 0;

      // Clear last action description
      state.lastActionDescription = null;
    },

    /**
     * Redo the last undone action
     * Restores the next state from future history
     */
    redo: (state) => {
      if (state.future.length === 0 || !state.present) {
        return;
      }

      // Move present to past
      state.past.push(cloneState(state.present));

      // Take first state from future and make it present
      const next = state.future.shift();
      if (next) {
        state.present = next;
      }

      // Limit past history size
      if (state.past.length > state.maxHistorySize) {
        state.past.shift();
      }

      // Update flags
      state.canUndo = state.past.length > 0;
      state.canRedo = state.future.length > 0;

      // Clear last action description
      state.lastActionDescription = null;
    },

    /**
     * Clear all history
     * Resets to initial state
     */
    clearHistory: (state) => {
      state.past = [];
      state.present = null;
      state.future = [];
      state.canUndo = false;
      state.canRedo = false;
      state.lastActionDescription = null;
    },

    /**
     * Initialize history with current state
     * Sets the present state without creating history
     */
    initializeHistory: (state, action: PayloadAction<TokensState>) => {
      state.present = cloneState(action.payload);
      state.past = [];
      state.future = [];
      state.canUndo = false;
      state.canRedo = false;
      state.lastActionDescription = null;
    },

    /**
     * Set maximum history size
     */
    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxHistorySize = Math.max(1, action.payload);

      // Trim past if necessary
      while (state.past.length > state.maxHistorySize) {
        state.past.shift();
      }
    },

    /**
     * Get the state that would be restored on undo
     * (for preview purposes)
     */
    peekUndo: (state) => {
      // This is a read-only action, just returns data via selector
      return state;
    },

    /**
     * Get the state that would be restored on redo
     * (for preview purposes)
     */
    peekRedo: (state) => {
      // This is a read-only action, just returns data via selector
      return state;
    },
  },
});

export const {
  recordAction,
  undo,
  redo,
  clearHistory,
  initializeHistory,
  setMaxHistorySize,
  peekUndo,
  peekRedo,
} = historySlice.actions;

// Selectors
export const selectCanUndo = (state: { history: HistoryState }) => state.history.canUndo;
export const selectCanRedo = (state: { history: HistoryState }) => state.history.canRedo;
export const selectPresentState = (state: { history: HistoryState }) => state.history.present;
export const selectLastActionDescription = (state: { history: HistoryState }) =>
  state.history.lastActionDescription;
export const selectHistorySize = (state: { history: HistoryState }) => ({
  past: state.history.past.length,
  future: state.history.future.length,
});
export const selectMaxHistorySize = (state: { history: HistoryState }) =>
  state.history.maxHistorySize;

export default historySlice.reducer;
