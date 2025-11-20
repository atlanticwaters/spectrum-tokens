import React from 'react';
import type { ExportSettings as ExportSettingsType } from '../../../shared/types';

interface ExportSettingsProps {
  settings: ExportSettingsType;
  onChange: (settings: ExportSettingsType) => void;
}

export const ExportSettings: React.FC<ExportSettingsProps> = ({ settings, onChange }) => {
  const handleChange = <K extends keyof ExportSettingsType>(
    key: K,
    value: ExportSettingsType[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '13px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#333',
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  return (
    <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Export Settings
      </h3>

      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="export-format">
          Format
        </label>
        <select
          id="export-format"
          style={selectStyle}
          value={settings.format}
          onChange={(e) => handleChange('format', e.target.value as ExportSettingsType['format'])}
        >
          <option value="dtcg">DTCG Only</option>
          <option value="spectrum">Spectrum Only</option>
          <option value="both">DTCG + Spectrum</option>
          <option value="style-dictionary">Style Dictionary</option>
        </select>
      </div>

      {settings.format === 'style-dictionary' && (
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="sd-platform">
            Style Dictionary Platform
          </label>
          <select
            id="sd-platform"
            style={selectStyle}
            value={settings.styleDictionaryPlatform || 'web'}
            onChange={(e) =>
              handleChange('styleDictionaryPlatform', e.target.value as 'web' | 'ios' | 'android' | 'compose')
            }
          >
            <option value="web">Web (No transforms)</option>
            <option value="ios">iOS (SwiftUI)</option>
            <option value="android">Android (XML)</option>
            <option value="compose">Android (Compose)</option>
          </select>
          <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
            {settings.styleDictionaryPlatform === 'web' && 'Preserves original token values'}
            {settings.styleDictionaryPlatform === 'ios' && 'Applies SwiftUI transforms (Color, CGFloat, Font.system)'}
            {settings.styleDictionaryPlatform === 'android' && 'Applies Android XML transforms (dp, sp)'}
            {settings.styleDictionaryPlatform === 'compose' && 'Applies Jetpack Compose transforms (Color, .dp, .sp)'}
          </div>
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="export-structure">
          Structure
        </label>
        <select
          id="export-structure"
          style={selectStyle}
          value={settings.structure}
          onChange={(e) => handleChange('structure', e.target.value as 'nested' | 'flat')}
        >
          <option value="nested">Nested</option>
          <option value="flat">Flat</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle} htmlFor="naming-convention">
          Naming Convention
        </label>
        <select
          id="naming-convention"
          style={selectStyle}
          value={settings.namingConvention}
          onChange={(e) =>
            handleChange('namingConvention', e.target.value as 'kebab-case' | 'camelCase' | 'snake_case')
          }
        >
          <option value="kebab-case">kebab-case</option>
          <option value="camelCase">camelCase</option>
          <option value="snake_case">snake_case</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={settings.includePrivate}
            onChange={(e) => handleChange('includePrivate', e.target.checked)}
            style={{ marginRight: '6px' }}
          />
          Include Private Tokens
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={settings.includeMetadata}
            onChange={(e) => handleChange('includeMetadata', e.target.checked)}
            style={{ marginRight: '6px' }}
          />
          Include Metadata
        </label>
      </div>
    </div>
  );
};
