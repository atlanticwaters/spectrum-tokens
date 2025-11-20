import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import collectionsReducer from './slices/collectionsSlice';
import settingsReducer from './slices/settingsSlice';
import storageReducer from './slices/storageSlice';
import themesReducer from './slices/themesSlice';
import tokensReducer from './slices/tokensSlice';
import toastsReducer from './slices/toastsSlice';
import historyReducer from './slices/historySlice';
import { historyMiddleware } from './middleware/historyMiddleware';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    collections: collectionsReducer,
    settings: settingsReducer,
    storage: storageReducer,
    themes: themesReducer,
    tokens: tokensReducer,
    toasts: toastsReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(historyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
