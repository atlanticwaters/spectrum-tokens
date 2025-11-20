import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CollectionSelection } from '../../../shared/types';

export interface CollectionsState {
  collections: CollectionSelection[];
  lastScanned: number | null;
}

const initialState: CollectionsState = {
  collections: [],
  lastScanned: null,
};

const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    setCollections: (state, action: PayloadAction<CollectionSelection[]>) => {
      state.collections = action.payload;
      state.lastScanned = Date.now();
    },
    toggleCollectionSelection: (state, action: PayloadAction<string>) => {
      const collection = state.collections.find((c) => c.collectionId === action.payload);
      if (collection) {
        collection.selected = !collection.selected;
      }
    },
    setCollectionSelection: (
      state,
      action: PayloadAction<{ collectionId: string; selected: boolean }>
    ) => {
      const collection = state.collections.find(
        (c) => c.collectionId === action.payload.collectionId
      );
      if (collection) {
        collection.selected = action.payload.selected;
      }
    },
    toggleModeSelection: (
      state,
      action: PayloadAction<{ collectionId: string; mode: string }>
    ) => {
      const collection = state.collections.find(
        (c) => c.collectionId === action.payload.collectionId
      );
      if (collection) {
        const modeIndex = collection.selectedModes.indexOf(action.payload.mode);
        if (modeIndex > -1) {
          collection.selectedModes.splice(modeIndex, 1);
        } else {
          collection.selectedModes.push(action.payload.mode);
        }
      }
    },
    selectAllCollections: (state) => {
      state.collections.forEach((collection) => {
        collection.selected = true;
      });
    },
    deselectAllCollections: (state) => {
      state.collections.forEach((collection) => {
        collection.selected = false;
      });
    },
    clearCollections: (state) => {
      state.collections = [];
      state.lastScanned = null;
    },
  },
});

export const {
  setCollections,
  toggleCollectionSelection,
  setCollectionSelection,
  toggleModeSelection,
  selectAllCollections,
  deselectAllCollections,
  clearCollections,
} = collectionsSlice.actions;

export default collectionsSlice.reducer;
