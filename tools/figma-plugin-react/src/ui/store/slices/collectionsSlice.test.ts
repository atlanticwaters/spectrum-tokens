import { describe, it, expect } from '@jest/globals';
import collectionsReducer, {
  setCollections,
  toggleCollectionSelection,
  setCollectionSelection,
  toggleModeSelection,
  selectAllCollections,
  deselectAllCollections,
  clearCollections,
  CollectionsState,
} from './collectionsSlice';
import type { CollectionSelection } from '../../../shared/types';

describe('collectionsSlice', () => {
  const mockCollections: CollectionSelection[] = [
    {
      collectionId: 'col1',
      collectionName: 'Colors',
      modes: ['light', 'dark'],
      selectedModes: ['light'],
      variableCount: 50,
      selected: true,
    },
    {
      collectionId: 'col2',
      collectionName: 'Spacing',
      modes: ['mobile', 'desktop'],
      selectedModes: ['mobile'],
      variableCount: 30,
      selected: false,
    },
  ];

  const initialState: CollectionsState = {
    collections: [],
    lastScanned: null,
  };

  it('should return initial state', () => {
    expect(collectionsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setCollections', () => {
    it('should set collections and update lastScanned', () => {
      const beforeTimestamp = Date.now();
      const state = collectionsReducer(initialState, setCollections(mockCollections));
      const afterTimestamp = Date.now();

      expect(state.collections).toEqual(mockCollections);
      expect(state.lastScanned).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(state.lastScanned).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should replace existing collections', () => {
      const stateWithCollections: CollectionsState = {
        collections: [mockCollections[0]],
        lastScanned: 1000,
      };

      const newCollections = [mockCollections[1]];
      const state = collectionsReducer(stateWithCollections, setCollections(newCollections));

      expect(state.collections).toEqual(newCollections);
      expect(state.collections.length).toBe(1);
    });
  });

  describe('toggleCollectionSelection', () => {
    it('should toggle collection from selected to unselected', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleCollectionSelection('col1')
      );

      expect(state.collections[0].selected).toBe(false);
    });

    it('should toggle collection from unselected to selected', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleCollectionSelection('col2')
      );

      expect(state.collections[1].selected).toBe(true);
    });

    it('should do nothing if collection is not found', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleCollectionSelection('nonexistent')
      );

      expect(state.collections).toEqual(mockCollections);
    });
  });

  describe('setCollectionSelection', () => {
    it('should set collection to selected', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        setCollectionSelection({ collectionId: 'col2', selected: true })
      );

      expect(state.collections[1].selected).toBe(true);
    });

    it('should set collection to unselected', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        setCollectionSelection({ collectionId: 'col1', selected: false })
      );

      expect(state.collections[0].selected).toBe(false);
    });
  });

  describe('toggleModeSelection', () => {
    it('should add mode to selectedModes if not present', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleModeSelection({ collectionId: 'col1', mode: 'dark' })
      );

      expect(state.collections[0].selectedModes).toContain('dark');
      expect(state.collections[0].selectedModes).toContain('light');
    });

    it('should remove mode from selectedModes if present', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleModeSelection({ collectionId: 'col1', mode: 'light' })
      );

      expect(state.collections[0].selectedModes).not.toContain('light');
    });

    it('should do nothing if collection is not found', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(
        stateWithCollections,
        toggleModeSelection({ collectionId: 'nonexistent', mode: 'light' })
      );

      expect(state.collections).toEqual(mockCollections);
    });
  });

  describe('selectAllCollections', () => {
    it('should select all collections', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(stateWithCollections, selectAllCollections());

      expect(state.collections.every((c) => c.selected)).toBe(true);
    });
  });

  describe('deselectAllCollections', () => {
    it('should deselect all collections', () => {
      const stateWithCollections: CollectionsState = {
        ...initialState,
        collections: [...mockCollections],
      };

      const state = collectionsReducer(stateWithCollections, deselectAllCollections());

      expect(state.collections.every((c) => !c.selected)).toBe(true);
    });
  });

  describe('clearCollections', () => {
    it('should clear all collections and reset lastScanned', () => {
      const stateWithCollections: CollectionsState = {
        collections: [...mockCollections],
        lastScanned: Date.now(),
      };

      const state = collectionsReducer(stateWithCollections, clearCollections());

      expect(state.collections).toEqual([]);
      expect(state.lastScanned).toBeNull();
    });
  });
});
