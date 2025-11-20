import { describe, it, expect } from '@jest/globals';
import settingsReducer, {
  setExportSettings,
  updateExportSetting,
  resetExportSettings,
  SettingsState,
} from './settingsSlice';
import { ExportSettings, DEFAULT_EXPORT_SETTINGS } from '../../../shared/types';

describe('settingsSlice', () => {
  const initialState: SettingsState = {
    exportSettings: DEFAULT_EXPORT_SETTINGS,
  };

  const customSettings: ExportSettings = {
    format: 'spectrum',
    structure: 'flat',
    fileOrganization: 'byCollection',
    includePrivate: true,
    includeDeprecated: true,
    namingConvention: 'camelCase',
    defaultUnit: 'rem',
    modeHandling: 'color-set',
    includeMetadata: false,
    generateUUIDs: 'random',
  };

  it('should return initial state', () => {
    expect(settingsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setExportSettings', () => {
    it('should set all export settings', () => {
      const state = settingsReducer(initialState, setExportSettings(customSettings));
      expect(state.exportSettings).toEqual(customSettings);
    });

    it('should replace previous settings', () => {
      const stateWithCustom: SettingsState = {
        exportSettings: customSettings,
      };

      const state = settingsReducer(
        stateWithCustom,
        setExportSettings(DEFAULT_EXPORT_SETTINGS)
      );
      expect(state.exportSettings).toEqual(DEFAULT_EXPORT_SETTINGS);
    });
  });

  describe('updateExportSetting', () => {
    it('should update format setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'format', value: 'spectrum' })
      );
      expect(state.exportSettings.format).toBe('spectrum');
    });

    it('should update structure setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'structure', value: 'flat' })
      );
      expect(state.exportSettings.structure).toBe('flat');
    });

    it('should update fileOrganization setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'fileOrganization', value: 'byComponent' })
      );
      expect(state.exportSettings.fileOrganization).toBe('byComponent');
    });

    it('should update includePrivate setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'includePrivate', value: true })
      );
      expect(state.exportSettings.includePrivate).toBe(true);
    });

    it('should update includeDeprecated setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'includeDeprecated', value: true })
      );
      expect(state.exportSettings.includeDeprecated).toBe(true);
    });

    it('should update namingConvention setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'namingConvention', value: 'snake_case' })
      );
      expect(state.exportSettings.namingConvention).toBe('snake_case');
    });

    it('should update defaultUnit setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'defaultUnit', value: 'rem' })
      );
      expect(state.exportSettings.defaultUnit).toBe('rem');
    });

    it('should update modeHandling setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'modeHandling', value: 'scale-set' })
      );
      expect(state.exportSettings.modeHandling).toBe('scale-set');
    });

    it('should update includeMetadata setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'includeMetadata', value: false })
      );
      expect(state.exportSettings.includeMetadata).toBe(false);
    });

    it('should update generateUUIDs setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'generateUUIDs', value: 'random' })
      );
      expect(state.exportSettings.generateUUIDs).toBe('random');
    });

    it('should only update specified setting', () => {
      const state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'format', value: 'spectrum' })
      );

      // Only format should change
      expect(state.exportSettings.format).toBe('spectrum');
      expect(state.exportSettings.structure).toBe(DEFAULT_EXPORT_SETTINGS.structure);
      expect(state.exportSettings.includePrivate).toBe(
        DEFAULT_EXPORT_SETTINGS.includePrivate
      );
    });

    it('should handle multiple updates correctly', () => {
      let state = settingsReducer(
        initialState,
        updateExportSetting({ key: 'format', value: 'spectrum' })
      );
      state = settingsReducer(
        state,
        updateExportSetting({ key: 'structure', value: 'flat' })
      );
      state = settingsReducer(
        state,
        updateExportSetting({ key: 'includePrivate', value: true })
      );

      expect(state.exportSettings.format).toBe('spectrum');
      expect(state.exportSettings.structure).toBe('flat');
      expect(state.exportSettings.includePrivate).toBe(true);
    });
  });

  describe('resetExportSettings', () => {
    it('should reset settings to defaults', () => {
      const stateWithCustom: SettingsState = {
        exportSettings: customSettings,
      };

      const state = settingsReducer(stateWithCustom, resetExportSettings());
      expect(state.exportSettings).toEqual(DEFAULT_EXPORT_SETTINGS);
    });

    it('should not change state if already at defaults', () => {
      const state = settingsReducer(initialState, resetExportSettings());
      expect(state.exportSettings).toEqual(DEFAULT_EXPORT_SETTINGS);
    });
  });
});
