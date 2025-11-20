import historyReducer, {
  recordAction,
  undo,
  redo,
  clearHistory,
  initializeHistory,
  setMaxHistorySize,
  selectCanUndo,
  selectCanRedo,
  selectPresentState,
  selectLastActionDescription,
  selectHistorySize,
  selectMaxHistorySize,
  HistoryState,
} from './historySlice';
import type { TokensState } from './tokensSlice';

// Helper to create a mock TokensState
const createMockTokensState = (tokenNames: string[]): TokensState => ({
  tokens: tokenNames.map((name) => ({
    name,
    value: '#000000',
    type: 'color' as const,
    description: `Token ${name}`,
  })),
  selectedToken: null,
  editingToken: null,
  isLoading: false,
  error: null,
});

describe('historySlice', () => {
  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = historyReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({
        past: [],
        present: null,
        future: [],
        canUndo: false,
        canRedo: false,
        maxHistorySize: 50,
        lastActionDescription: null,
      });
    });

    it('should have correct initial flags', () => {
      const state = historyReducer(undefined, { type: 'unknown' });
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });

  describe('initializeHistory', () => {
    it('should initialize with a state', () => {
      const tokensState = createMockTokensState(['token1']);
      const state = historyReducer(undefined, initializeHistory(tokensState));

      expect(state.present).toEqual(tokensState);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });

    it('should reset existing history when initializing', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Add token2' })
      );

      const newState = createMockTokensState(['token3']);
      state = historyReducer(state, initializeHistory(newState));

      expect(state.present).toEqual(newState);
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('should create a deep copy of the state', () => {
      const tokensState = createMockTokensState(['token1']);
      const state = historyReducer(undefined, initializeHistory(tokensState));

      // Modify original
      tokensState.tokens[0].name = 'modified';

      // Should not affect stored state
      expect(state.present?.tokens[0].name).toBe('token1');
    });
  });

  describe('recordAction', () => {
    it('should record the first action', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      const newState = createMockTokensState(['token1', 'token2']);

      state = historyReducer(
        state,
        recordAction({ state: newState, description: 'Added token2' })
      );

      expect(state.present).toEqual(newState);
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(0);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
      expect(state.lastActionDescription).toBe('Added token2');
    });

    it('should move present to past when recording new action', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      const state2 = createMockTokensState(['token1', 'token2']);
      const state3 = createMockTokensState(['token1', 'token2', 'token3']);

      state = historyReducer(state, recordAction({ state: state2, description: 'Add token2' }));
      state = historyReducer(state, recordAction({ state: state3, description: 'Add token3' }));

      expect(state.present?.tokens).toHaveLength(3);
      expect(state.past).toHaveLength(2);
      expect(state.past[0].tokens).toHaveLength(1);
      expect(state.past[1].tokens).toHaveLength(2);
    });

    it('should clear future when recording new action', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(state, undo());

      // Now future has one item
      expect(state.future).toHaveLength(1);

      // Record new action should clear future
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Add token3' })
      );

      expect(state.future).toHaveLength(0);
      expect(state.canRedo).toBe(false);
    });

    it('should limit history size to maxHistorySize', () => {
      let state = historyReducer(undefined, setMaxHistorySize(3));
      state = historyReducer(state, initializeHistory(createMockTokensState(['token0'])));

      // Add 5 states (should only keep 3 in past)
      for (let i = 1; i <= 5; i++) {
        state = historyReducer(
          state,
          recordAction({
            state: createMockTokensState([`token${i}`]),
            description: `Add token${i}`,
          })
        );
      }

      expect(state.past.length).toBe(3);
      expect(state.past[0].tokens[0].name).toBe('token2'); // Oldest is token2 (0 and 1 were dropped)
      expect(state.present?.tokens[0].name).toBe('token5');
    });

    it('should create deep copies to prevent mutation', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      const tokensState = createMockTokensState(['token2']);

      state = historyReducer(
        state,
        recordAction({ state: tokensState, description: 'Add token2' })
      );

      // Mutate original
      tokensState.tokens[0].name = 'mutated';

      // Should not affect stored state
      expect(state.present?.tokens[0].name).toBe('token2');
    });

    it('should update lastActionDescription', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));

      state = historyReducer(
        state,
        recordAction({
          state: createMockTokensState(['token2']),
          description: 'Added new token',
        })
      );

      expect(state.lastActionDescription).toBe('Added new token');
    });
  });

  describe('undo', () => {
    it('should undo to previous state', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );

      state = historyReducer(state, undo());

      expect(state.present?.tokens[0].name).toBe('token1');
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(1);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(true);
    });

    it('should move present to future when undoing', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );

      state = historyReducer(state, undo());

      expect(state.future[0].tokens[0].name).toBe('token2');
    });

    it('should handle multiple undos', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Change to token3' })
      );

      state = historyReducer(state, undo());
      expect(state.present?.tokens[0].name).toBe('token2');

      state = historyReducer(state, undo());
      expect(state.present?.tokens[0].name).toBe('token1');
    });

    it('should do nothing if no past history', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      const beforeUndo = JSON.parse(JSON.stringify(state));

      state = historyReducer(state, undo());

      expect(state).toEqual(beforeUndo);
    });

    it('should do nothing if present is null', () => {
      const state = historyReducer(undefined, undo());

      expect(state.present).toBeNull();
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);
    });

    it('should clear lastActionDescription', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({
          state: createMockTokensState(['token2']),
          description: 'Added token',
        })
      );

      expect(state.lastActionDescription).toBe('Added token');

      state = historyReducer(state, undo());

      expect(state.lastActionDescription).toBeNull();
    });
  });

  describe('redo', () => {
    it('should redo to next state', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(state, undo());

      state = historyReducer(state, redo());

      expect(state.present?.tokens[0].name).toBe('token2');
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(0);
      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(false);
    });

    it('should move present to past when redoing', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(state, undo());

      state = historyReducer(state, redo());

      expect(state.past[0].tokens[0].name).toBe('token1');
    });

    it('should handle multiple redos', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Change to token3' })
      );
      state = historyReducer(state, undo());
      state = historyReducer(state, undo());

      state = historyReducer(state, redo());
      expect(state.present?.tokens[0].name).toBe('token2');

      state = historyReducer(state, redo());
      expect(state.present?.tokens[0].name).toBe('token3');
    });

    it('should do nothing if no future history', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      const beforeRedo = JSON.parse(JSON.stringify(state));

      state = historyReducer(state, redo());

      expect(state).toEqual(beforeRedo);
    });

    it('should do nothing if present is null', () => {
      const state = historyReducer(undefined, redo());

      expect(state.present).toBeNull();
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);
    });

    it('should respect maxHistorySize when redoing', () => {
      let state = historyReducer(undefined, setMaxHistorySize(2));
      state = historyReducer(state, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Change to token3' })
      );
      state = historyReducer(state, undo());
      state = historyReducer(state, undo());

      state = historyReducer(state, redo());

      expect(state.past.length).toBeLessThanOrEqual(2);
    });

    it('should clear lastActionDescription', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({
          state: createMockTokensState(['token2']),
          description: 'Added token',
        })
      );
      state = historyReducer(state, undo());

      state = historyReducer(state, redo());

      expect(state.lastActionDescription).toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Change to token3' })
      );

      state = historyReducer(state, clearHistory());

      expect(state.past).toEqual([]);
      expect(state.present).toBeNull();
      expect(state.future).toEqual([]);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
      expect(state.lastActionDescription).toBeNull();
    });

    it('should work on already empty history', () => {
      const state = historyReducer(undefined, clearHistory());

      expect(state.past).toEqual([]);
      expect(state.present).toBeNull();
      expect(state.future).toEqual([]);
    });
  });

  describe('setMaxHistorySize', () => {
    it('should update max history size', () => {
      const state = historyReducer(undefined, setMaxHistorySize(100));

      expect(state.maxHistorySize).toBe(100);
    });

    it('should enforce minimum of 1', () => {
      const state = historyReducer(undefined, setMaxHistorySize(0));

      expect(state.maxHistorySize).toBe(1);
    });

    it('should trim past history if new size is smaller', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token0'])));

      // Add 5 items to history
      for (let i = 1; i <= 5; i++) {
        state = historyReducer(
          state,
          recordAction({
            state: createMockTokensState([`token${i}`]),
            description: `Add token${i}`,
          })
        );
      }

      expect(state.past).toHaveLength(5);

      // Reduce max size to 3
      state = historyReducer(state, setMaxHistorySize(3));

      expect(state.past).toHaveLength(3);
      expect(state.past[0].tokens[0].name).toBe('token3'); // Oldest kept
    });

    it('should not trim if new size is larger', () => {
      let state = historyReducer(undefined, setMaxHistorySize(5));
      state = historyReducer(state, initializeHistory(createMockTokensState(['token0'])));

      for (let i = 1; i <= 3; i++) {
        state = historyReducer(
          state,
          recordAction({
            state: createMockTokensState([`token${i}`]),
            description: `Add token${i}`,
          })
        );
      }

      expect(state.past).toHaveLength(3);

      state = historyReducer(state, setMaxHistorySize(10));

      expect(state.past).toHaveLength(3);
    });
  });

  describe('selectors', () => {
    const createStateWrapper = (historyState: HistoryState) => ({
      history: historyState,
    });

    it('selectCanUndo should return canUndo flag', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      expect(selectCanUndo(createStateWrapper(state))).toBe(false);

      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Add token2' })
      );
      expect(selectCanUndo(createStateWrapper(state))).toBe(true);
    });

    it('selectCanRedo should return canRedo flag', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      expect(selectCanRedo(createStateWrapper(state))).toBe(false);

      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Add token2' })
      );
      state = historyReducer(state, undo());
      expect(selectCanRedo(createStateWrapper(state))).toBe(true);
    });

    it('selectPresentState should return current state', () => {
      const tokensState = createMockTokensState(['token1']);
      const state = historyReducer(undefined, initializeHistory(tokensState));

      expect(selectPresentState(createStateWrapper(state))).toEqual(tokensState);
    });

    it('selectLastActionDescription should return description', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      expect(selectLastActionDescription(createStateWrapper(state))).toBeNull();

      state = historyReducer(
        state,
        recordAction({
          state: createMockTokensState(['token2']),
          description: 'Added new token',
        })
      );
      expect(selectLastActionDescription(createStateWrapper(state))).toBe('Added new token');
    });

    it('selectHistorySize should return past and future counts', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Add token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Add token3' })
      );
      state = historyReducer(state, undo());

      const size = selectHistorySize(createStateWrapper(state));
      expect(size.past).toBe(1);
      expect(size.future).toBe(1);
    });

    it('selectMaxHistorySize should return max size', () => {
      const state = historyReducer(undefined, setMaxHistorySize(25));

      expect(selectMaxHistorySize(createStateWrapper(state))).toBe(25);
    });
  });

  describe('undo/redo workflow', () => {
    it('should support full undo/redo workflow', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));

      // Add two more states
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token3']), description: 'Change to token3' })
      );

      expect(state.present?.tokens[0].name).toBe('token3');

      // Undo twice
      state = historyReducer(state, undo());
      expect(state.present?.tokens[0].name).toBe('token2');

      state = historyReducer(state, undo());
      expect(state.present?.tokens[0].name).toBe('token1');

      // Redo once
      state = historyReducer(state, redo());
      expect(state.present?.tokens[0].name).toBe('token2');

      // Make a new change (should clear future)
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token4']), description: 'Change to token4' })
      );

      expect(state.present?.tokens[0].name).toBe('token4');
      expect(state.canRedo).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty token arrays', () => {
      const emptyState = createMockTokensState([]);
      const state = historyReducer(undefined, initializeHistory(emptyState));

      expect(state.present?.tokens).toEqual([]);
    });

    it('should handle complex token state', () => {
      const complexState: TokensState = {
        tokens: [
          { name: 'token1', value: '#ff0000', type: 'color' },
          { name: 'token2', value: '16px', type: 'dimension' },
        ],
        selectedToken: { name: 'token1', value: '#ff0000', type: 'color' },
        editingToken: null,
        isLoading: true,
        error: 'Some error',
      };

      const state = historyReducer(undefined, initializeHistory(complexState));

      expect(state.present).toEqual(complexState);
    });

    it('should maintain independence of stored states', () => {
      let state = historyReducer(undefined, initializeHistory(createMockTokensState(['token1'])));
      state = historyReducer(
        state,
        recordAction({ state: createMockTokensState(['token2']), description: 'Change to token2' })
      );

      // Modify present (should not affect past)
      if (state.present) {
        state.present.tokens[0].name = 'modified';
      }

      expect(state.past[0].tokens[0].name).toBe('token1');
    });
  });
});
