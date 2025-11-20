import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExportSettings, DEFAULT_EXPORT_SETTINGS } from '../../../shared/types';

export interface SettingsState {
  exportSettings: ExportSettings;
}

const initialState: SettingsState = {
  exportSettings: DEFAULT_EXPORT_SETTINGS,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setExportSettings: (state, action: PayloadAction<ExportSettings>) => {
      state.exportSettings = action.payload;
    },
    updateExportSetting: <K extends keyof ExportSettings>(
      state: SettingsState,
      action: PayloadAction<{ key: K; value: ExportSettings[K] }>
    ) => {
      state.exportSettings[action.payload.key] = action.payload.value;
    },
    resetExportSettings: (state) => {
      state.exportSettings = DEFAULT_EXPORT_SETTINGS;
    },
  },
});

export const { setExportSettings, updateExportSetting, resetExportSettings } =
  settingsSlice.actions;

export default settingsSlice.reducer;
