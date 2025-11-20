/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Theme {
  id: string;
  name: string;
  tokens: Record<string, any>;
  modes: string[];
  defaultMode: string;
}

export interface ThemesState {
  themes: Theme[];
  activeThemeId: string | null;
  activeMode: string | null;
}

const initialState: ThemesState = {
  themes: [],
  activeThemeId: null,
  activeMode: null,
};

const themesSlice = createSlice({
  name: 'themes',
  initialState,
  reducers: {
    setThemes(state, action: PayloadAction<Theme[]>) {
      state.themes = action.payload;
    },
    addTheme(state, action: PayloadAction<Theme>) {
      state.themes.push(action.payload);
    },
    updateTheme(state, action: PayloadAction<Theme>) {
      const index = state.themes.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.themes[index] = action.payload;
      }
    },
    removeTheme(state, action: PayloadAction<string>) {
      state.themes = state.themes.filter((t) => t.id !== action.payload);
      if (state.activeThemeId === action.payload) {
        state.activeThemeId = null;
        state.activeMode = null;
      }
    },
    setActiveTheme(state, action: PayloadAction<string>) {
      state.activeThemeId = action.payload;
      const theme = state.themes.find((t) => t.id === action.payload);
      if (theme) {
        state.activeMode = theme.defaultMode;
      }
    },
    setActiveMode(state, action: PayloadAction<string>) {
      state.activeMode = action.payload;
    },
    clearThemes() {
      return initialState;
    },
  },
});

export const {
  setThemes,
  addTheme,
  updateTheme,
  removeTheme,
  setActiveTheme,
  setActiveMode,
  clearThemes,
} = themesSlice.actions;

export default themesSlice.reducer;
