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

import { describe, it, expect } from '@jest/globals';
import themesReducer, {
  setThemes,
  addTheme,
  updateTheme,
  removeTheme,
  setActiveTheme,
  setActiveMode,
  clearThemes,
  Theme,
} from './themesSlice';

describe('themesSlice', () => {
  const mockTheme1: Theme = {
    id: 'theme-1',
    name: 'Light Theme',
    tokens: { 'color-primary': '#ff0000' },
    modes: ['light', 'dark'],
    defaultMode: 'light',
  };

  const mockTheme2: Theme = {
    id: 'theme-2',
    name: 'Dark Theme',
    tokens: { 'color-primary': '#0000ff' },
    modes: ['dark'],
    defaultMode: 'dark',
  };

  const initialState = {
    themes: [],
    activeThemeId: null,
    activeMode: null,
  };

  describe('setThemes', () => {
    it('sets themes array', () => {
      const state = themesReducer(initialState, setThemes([mockTheme1, mockTheme2]));

      expect(state.themes).toHaveLength(2);
      expect(state.themes[0]).toEqual(mockTheme1);
      expect(state.themes[1]).toEqual(mockTheme2);
    });

    it('replaces existing themes', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, setThemes([mockTheme2]));

      expect(state.themes).toHaveLength(1);
      expect(state.themes[0]).toEqual(mockTheme2);
    });

    it('can set empty themes array', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, setThemes([]));

      expect(state.themes).toHaveLength(0);
    });
  });

  describe('addTheme', () => {
    it('adds theme to empty array', () => {
      const state = themesReducer(initialState, addTheme(mockTheme1));

      expect(state.themes).toHaveLength(1);
      expect(state.themes[0]).toEqual(mockTheme1);
    });

    it('appends theme to existing themes', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, addTheme(mockTheme2));

      expect(state.themes).toHaveLength(2);
      expect(state.themes[1]).toEqual(mockTheme2);
    });

    it('does not modify active theme', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, addTheme(mockTheme2));

      expect(state.activeThemeId).toBe('theme-1');
      expect(state.activeMode).toBe('light');
    });
  });

  describe('updateTheme', () => {
    it('updates existing theme', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: null,
        activeMode: null,
      };

      const updatedTheme = {
        ...mockTheme1,
        name: 'Updated Light Theme',
        tokens: { 'color-primary': '#00ff00' },
      };

      const state = themesReducer(existingState, updateTheme(updatedTheme));

      expect(state.themes[0].name).toBe('Updated Light Theme');
      expect(state.themes[0].tokens['color-primary']).toBe('#00ff00');
      expect(state.themes[1]).toEqual(mockTheme2); // Second theme unchanged
    });

    it('does not add theme if not found', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const nonExistentTheme: Theme = {
        id: 'theme-999',
        name: 'New Theme',
        tokens: {},
        modes: ['light'],
        defaultMode: 'light',
      };

      const state = themesReducer(existingState, updateTheme(nonExistentTheme));

      expect(state.themes).toHaveLength(1);
      expect(state.themes[0]).toEqual(mockTheme1);
    });
  });

  describe('removeTheme', () => {
    it('removes theme by id', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, removeTheme('theme-1'));

      expect(state.themes).toHaveLength(1);
      expect(state.themes[0]).toEqual(mockTheme2);
    });

    it('clears active theme if removing active theme', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, removeTheme('theme-1'));

      expect(state.activeThemeId).toBeNull();
      expect(state.activeMode).toBeNull();
    });

    it('does not clear active theme if removing different theme', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, removeTheme('theme-2'));

      expect(state.activeThemeId).toBe('theme-1');
      expect(state.activeMode).toBe('light');
    });

    it('handles removing non-existent theme', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, removeTheme('nonexistent'));

      expect(state.themes).toHaveLength(1);
      expect(state.themes[0]).toEqual(mockTheme1);
    });
  });

  describe('setActiveTheme', () => {
    it('sets active theme and default mode', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, setActiveTheme('theme-1'));

      expect(state.activeThemeId).toBe('theme-1');
      expect(state.activeMode).toBe('light'); // mockTheme1's default mode
    });

    it('changes active theme', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, setActiveTheme('theme-2'));

      expect(state.activeThemeId).toBe('theme-2');
      expect(state.activeMode).toBe('dark'); // mockTheme2's default mode
    });

    it('handles setting non-existent theme', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: null,
        activeMode: null,
      };

      const state = themesReducer(existingState, setActiveTheme('nonexistent'));

      expect(state.activeThemeId).toBe('nonexistent');
      expect(state.activeMode).toBeNull(); // Theme not found, mode stays null
    });
  });

  describe('setActiveMode', () => {
    it('sets active mode', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, setActiveMode('dark'));

      expect(state.activeMode).toBe('dark');
      expect(state.activeThemeId).toBe('theme-1'); // Theme unchanged
    });

    it('can set mode when no active theme', () => {
      const state = themesReducer(initialState, setActiveMode('custom'));

      expect(state.activeMode).toBe('custom');
      expect(state.activeThemeId).toBeNull();
    });
  });

  describe('clearThemes', () => {
    it('resets to initial state', () => {
      const existingState = {
        themes: [mockTheme1, mockTheme2],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, clearThemes());

      expect(state).toEqual(initialState);
    });

    it('works on already empty state', () => {
      const state = themesReducer(initialState, clearThemes());

      expect(state).toEqual(initialState);
    });
  });

  describe('edge cases', () => {
    it('handles undefined state', () => {
      const state = themesReducer(undefined, setThemes([mockTheme1]));

      expect(state.themes).toHaveLength(1);
      expect(state.activeThemeId).toBeNull();
      expect(state.activeMode).toBeNull();
    });

    it('preserves other state when updating themes', () => {
      const existingState = {
        themes: [mockTheme1],
        activeThemeId: 'theme-1',
        activeMode: 'light',
      };

      const state = themesReducer(existingState, addTheme(mockTheme2));

      expect(state.activeThemeId).toBe('theme-1');
      expect(state.activeMode).toBe('light');
      expect(state.themes).toHaveLength(2);
    });
  });

  describe('complex scenarios', () => {
    it('handles full theme lifecycle', () => {
      let state: any = initialState;

      // Add themes
      state = themesReducer(state, addTheme(mockTheme1));
      state = themesReducer(state, addTheme(mockTheme2));
      expect(state.themes).toHaveLength(2);

      // Set active theme
      state = themesReducer(state, setActiveTheme('theme-1'));
      expect(state.activeThemeId).toBe('theme-1');
      expect(state.activeMode).toBe('light');

      // Change mode
      state = themesReducer(state, setActiveMode('dark'));
      expect(state.activeMode).toBe('dark');

      // Update theme
      const updated = { ...mockTheme1, name: 'Updated' };
      state = themesReducer(state, updateTheme(updated));
      expect(state.themes[0].name).toBe('Updated');

      // Remove inactive theme
      state = themesReducer(state, removeTheme('theme-2'));
      expect(state.themes).toHaveLength(1);
      expect(state.activeThemeId).toBe('theme-1'); // Still active

      // Remove active theme
      state = themesReducer(state, removeTheme('theme-1'));
      expect(state.themes).toHaveLength(0);
      expect(state.activeThemeId).toBeNull();
      expect(state.activeMode).toBeNull();
    });
  });
});
