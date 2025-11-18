# Figma Plugin - Example Code Skeletons

This document contains example skeleton code for the key components of the Figma plugin. These are meant to illustrate the architecture and are not complete implementations.

***

## UI Layer Example

### src/ui/ui.tsx (Main UI Component)

```typescript
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CollectionSelector } from './components/CollectionSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ExportResults } from './components/ExportResults';
import { ErrorDisplay } from './components/ErrorDisplay';
import { MessageType, type PluginMessage, type CollectionSummary, type ExportConfig } from '@shared/types/plugin-messages';
import './styles/main.css';

type AppState = 'loading' | 'selecting' | 'exporting' | 'success' | 'error';

function App() {
  const [state, setState] = useState<AppState>('loading');
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    collectionIds: [],
    includeModes: true,
    generateUUIDs: true,
    includeDescriptions: true,
    fileNamingStrategy: 'collection-name',
    outputFormat: 'single-file'
  });
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exportedFiles, setExportedFiles] = useState<any[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);

  // Initialize: Request collections from plugin
  useEffect(() => {
    window.parent.postMessage({
      pluginMessage: {
        type: MessageType.FETCH_COLLECTIONS,
        timestamp: Date.now()
      }
    }, '*');
  }, []);

  // Listen for messages from plugin
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message: PluginMessage = event.data.pluginMessage;
      if (!message) return;

      switch (message.type) {
        case MessageType.COLLECTIONS_LOADED:
          setCollections(message.collections);
          setState('selecting');
          break;

        case MessageType.EXPORT_PROGRESS:
          setProgress(message.progress);
          setProgressStatus(message.status);
          break;

        case MessageType.EXPORT_SUCCESS:
          setExportedFiles(message.files);
          setTotalTokens(message.totalTokens);
          setState('success');
          break;

        case MessageType.EXPORT_ERROR:
          setError(message.error);
          setState('error');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleExport = () => {
    if (selectedCollectionIds.length === 0) {
      setError('Please select at least one collection');
      setState('error');
      return;
    }

    setState('exporting');
    setProgress(0);

    window.parent.postMessage({
      pluginMessage: {
        type: MessageType.EXPORT_TOKENS,
        timestamp: Date.now(),
        config: {
          ...exportConfig,
          collectionIds: selectedCollectionIds
        }
      }
    }, '*');
  };

  const handleTryAgain = () => {
    setState('selecting');
    setError(null);
  };

  return (
    <div className="plugin-container">
      <header className="plugin-header">
        <h1>Spectrum Design Tokens Exporter</h1>
      </header>

      <main className="plugin-main">
        {state === 'loading' && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading collections...</p>
          </div>
        )}

        {state === 'selecting' && (
          <>
            <CollectionSelector
              collections={collections}
              selectedIds={selectedCollectionIds}
              onSelectionChange={setSelectedCollectionIds}
            />

            <SettingsPanel
              config={exportConfig}
              onConfigChange={setExportConfig}
            />

            <button
              className="export-button"
              onClick={handleExport}
              disabled={selectedCollectionIds.length === 0}
            >
              Export Tokens
            </button>
          </>
        )}

        {state === 'exporting' && (
          <ProgressIndicator
            progress={progress}
            status={progressStatus}
          />
        )}

        {state === 'success' && (
          <ExportResults
            files={exportedFiles}
            totalTokens={totalTokens}
            onExportAgain={handleTryAgain}
          />
        )}

        {state === 'error' && error && (
          <ErrorDisplay
            error={error}
            onTryAgain={handleTryAgain}
          />
        )}
      </main>
    </div>
  );
}

// Render app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
```

### src/ui/components/CollectionSelector.tsx

```typescript
import React from 'react';
import type { CollectionSummary } from '@shared/types/plugin-messages';

interface Props {
  collections: CollectionSummary[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CollectionSelector({ collections, selectedIds, onSelectionChange }: Props) {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(collections.map(c => c.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <section className="collection-selector">
      <div className="section-header">
        <h2>Step 1: Select Collections</h2>
        <div className="actions">
          <button onClick={handleSelectAll}>Select All</button>
          <button onClick={handleDeselectAll}>Deselect All</button>
        </div>
      </div>

      <div className="collection-list">
        {collections.map(collection => (
          <label key={collection.id} className="collection-item">
            <input
              type="checkbox"
              checked={selectedIds.includes(collection.id)}
              onChange={() => handleToggle(collection.id)}
            />
            <div className="collection-info">
              <div className="collection-name">{collection.name}</div>
              <div className="collection-meta">
                {collection.variableCount} variables
                {collection.modes.length > 1 && (
                  <span> • {collection.modes.length} modes</span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="empty-state">
          <p>No variable collections found in this file.</p>
          <p>Create some variables to get started.</p>
        </div>
      )}
    </section>
  );
}
```

***

## Plugin Code Layer Example

### src/plugin/code.ts (Main Plugin Entry)

```typescript
import { FigmaVariablesAPI } from './api/FigmaVariablesAPI';
import { CollectionReader } from './api/CollectionReader';
import { VariableResolver } from './api/VariableResolver';
import { TokenConverter } from './conversion/TokenConverter';
import { TypeMapper } from './conversion/TypeMapper';
import { ValueTransformer } from './conversion/ValueTransformer';
import { FileGenerator } from './export/FileGenerator';
import { Validator } from './export/Validator';
import { Formatter } from './export/Formatter';
import { ErrorHandler } from './utils/error-handler';
import { MessageType, type PluginMessage, type ExportConfig } from '@shared/types/plugin-messages';

// Show plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Spectrum Design Tokens Exporter'
});

// Initialize services
const api = new FigmaVariablesAPI();
const reader = new CollectionReader(api);
const resolver = new VariableResolver(api);
const typeMapper = new TypeMapper();
const valueTransformer = new ValueTransformer();
const validator = new Validator();
const formatter = new Formatter();

// Handle messages from UI
figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    switch (message.type) {
      case MessageType.FETCH_COLLECTIONS:
        await handleFetchCollections();
        break;

      case MessageType.EXPORT_TOKENS:
        await handleExportTokens(message.config);
        break;

      case MessageType.CANCEL_EXPORT:
        figma.closePlugin();
        break;
    }
  } catch (error) {
    const errorMessage = ErrorHandler.handleError(error);
    figma.ui.postMessage(errorMessage);
  }
};

/**
 * Fetch collections and send to UI
 */
async function handleFetchCollections() {
  const summaries = await reader.getCollectionSummaries();

  figma.ui.postMessage({
    type: MessageType.COLLECTIONS_LOADED,
    timestamp: Date.now(),
    collections: summaries
  });
}

/**
 * Export tokens based on config
 */
async function handleExportTokens(config: ExportConfig) {
  const { collectionIds } = config;

  // Notify UI: Starting export
  figma.ui.postMessage({
    type: MessageType.EXPORT_PROGRESS,
    timestamp: Date.now(),
    progress: 0,
    status: 'Initializing export...'
  });

  // Build resolver cache
  const collections = await api.getLocalCollections();
  await resolver.buildCache(collections);

  // Convert each collection
  const tokensByCollection = new Map();
  let processedCount = 0;

  for (const collectionId of collectionIds) {
    const collectionData = await reader.getCollectionData(collectionId);

    figma.ui.postMessage({
      type: MessageType.EXPORT_PROGRESS,
      timestamp: Date.now(),
      progress: Math.round((processedCount / collectionIds.length) * 50),
      status: `Converting ${collectionData.collection.name}...`,
      currentCollection: collectionData.collection.name
    });

    const converter = new TokenConverter(
      typeMapper,
      valueTransformer,
      resolver,
      config
    );

    const tokens = await converter.convertCollection(collectionData);
    tokensByCollection.set(collectionData.collection.name, tokens);

    processedCount++;
  }

  // Generate files
  figma.ui.postMessage({
    type: MessageType.EXPORT_PROGRESS,
    timestamp: Date.now(),
    progress: 75,
    status: 'Generating files...'
  });

  const fileGenerator = new FileGenerator(formatter, config);
  const files = fileGenerator.generateFiles(tokensByCollection);

  // Validate output
  figma.ui.postMessage({
    type: MessageType.EXPORT_PROGRESS,
    timestamp: Date.now(),
    progress: 90,
    status: 'Validating tokens...'
  });

  for (const file of files) {
    const tokenFile = JSON.parse(file.content);
    const validationResult = validator.validate(tokenFile);

    if (!validationResult.valid) {
      throw new Error(
        `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`
      );
    }
  }

  // Trigger download for each file
  for (const file of files) {
    const blob = new Blob([file.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Note: In actual implementation, we'd use Figma's clientStorage
    // or a different mechanism to trigger download
    console.log(`File ready: ${file.fileName}`, url);
  }

  // Calculate total tokens
  const totalTokens = files.reduce((sum, f) => sum + f.tokenCount, 0);

  // Notify success
  figma.ui.postMessage({
    type: MessageType.EXPORT_SUCCESS,
    timestamp: Date.now(),
    files: files.map(f => ({
      fileName: f.fileName,
      tokenCount: f.tokenCount,
      size: f.size
    })),
    totalTokens
  });

  figma.notify(`Successfully exported ${totalTokens} tokens!`);
}
```

### src/plugin/api/FigmaVariablesAPI.ts

```typescript
import type { FigmaCollection, FigmaVariable, VariableAlias, VariableValue } from '@shared/types/figma-types';

/**
 * Wrapper around Figma Variables API
 */
export class FigmaVariablesAPI {
  /**
   * Get all local variable collections
   */
  async getLocalCollections(): Promise<FigmaCollection[]> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    return collections.map(c => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map(m => ({
        modeId: m.modeId,
        name: m.name
      })),
      variableIds: c.variableIds,
      defaultModeId: c.defaultModeId
    }));
  }

  /**
   * Get variables from a collection
   */
  async getVariablesInCollection(collectionId: string): Promise<FigmaVariable[]> {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const variables: FigmaVariable[] = [];
    for (const varId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(varId);
      if (variable) {
        variables.push({
          id: variable.id,
          name: variable.name,
          resolvedType: variable.resolvedType,
          valuesByMode: variable.valuesByMode,
          description: variable.description,
          scopes: variable.scopes,
          codeSyntax: variable.codeSyntax
        });
      }
    }

    return variables;
  }

  /**
   * Get variable by ID
   */
  async getVariableById(id: string): Promise<FigmaVariable | null> {
    const variable = await figma.variables.getVariableByIdAsync(id);
    if (!variable) return null;

    return {
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      valuesByMode: variable.valuesByMode,
      description: variable.description,
      scopes: variable.scopes,
      codeSyntax: variable.codeSyntax
    };
  }

  /**
   * Check if value is an alias
   */
  isAlias(value: VariableValue): value is VariableAlias {
    return typeof value === 'object' &&
           value !== null &&
           'type' in value &&
           value.type === 'VARIABLE_ALIAS';
  }
}
```

### src/plugin/conversion/TokenConverter.ts

```typescript
import type { CollectionData } from '../api/CollectionReader';
import type { TokenGroup, DesignToken, TokenValue, TokenType } from '@shared/types/token-types';
import type { ExportConfig } from '@shared/types/plugin-messages';
import type { FigmaVariable, FigmaCollection } from '@shared/types/figma-types';
import { TypeMapper } from './TypeMapper';
import { ValueTransformer } from './ValueTransformer';
import { VariableResolver } from '../api/VariableResolver';

/**
 * Main converter orchestrating the conversion process
 */
export class TokenConverter {
  constructor(
    private typeMapper: TypeMapper,
    private valueTransformer: ValueTransformer,
    private resolver: VariableResolver,
    private config: ExportConfig
  ) {}

  /**
   * Convert collection data to token file
   */
  async convertCollection(data: CollectionData): Promise<TokenGroup> {
    const { collection, variables } = data;

    const tokenGroup: TokenGroup = {
      $description: `Tokens from Figma collection: ${collection.name}`,
      $extensions: {
        'com.figma': {
          collectionId: collection.id,
          modes: collection.modes.reduce((acc, mode) => {
            acc[mode.name] = { modeId: mode.modeId };
            return acc;
          }, {} as Record<string, { modeId: string }>)
        }
      }
    };

    // Group variables by hierarchy
    for (const variable of variables) {
      const tokens = this.convertVariable(variable, collection);
      this.mergeIntoGroup(tokenGroup, tokens, variable.name);
    }

    return tokenGroup;
  }

  /**
   * Convert a single variable to token(s)
   */
  private convertVariable(
    variable: FigmaVariable,
    collection: FigmaCollection
  ): Record<string, DesignToken> {
    const baseType = this.typeMapper.mapType(variable.resolvedType);
    const specificType = this.typeMapper.inferSpecificType(variable, baseType);

    const tokens: Record<string, DesignToken> = {};

    // Get default mode value
    const defaultModeId = collection.defaultModeId;
    const value = variable.valuesByMode[defaultModeId];
    const tokenValue = this.getTokenValue(value, specificType, defaultModeId);

    tokens['default'] = {
      $value: tokenValue,
      $type: specificType,
      $description: this.config.includeDescriptions
        ? variable.description || undefined
        : undefined,
      $extensions: {
        'com.figma': {
          variableId: variable.id,
          collectionId: collection.id,
          scopes: variable.scopes,
          codeSyntax: variable.codeSyntax
        }
      }
    };

    return tokens;
  }

  /**
   * Get token value (handle aliases)
   */
  private getTokenValue(
    value: any,
    type: TokenType,
    modeId: string
  ): TokenValue {
    // If alias, convert to token reference
    if (this.resolver.isAlias(value)) {
      return this.resolver.getVariableReferencePath(value.id);
    }

    // Transform concrete value
    return this.valueTransformer.transformValue(value, type);
  }

  /**
   * Merge tokens into group hierarchy
   */
  private mergeIntoGroup(
    group: TokenGroup,
    tokens: Record<string, DesignToken>,
    variableName: string
  ): void {
    const parts = variableName.split('/');
    const tokenName = parts.pop()!;

    // Navigate/create nested groups
    let currentGroup = group;
    for (const part of parts) {
      if (!currentGroup[part]) {
        currentGroup[part] = {};
      }
      currentGroup = currentGroup[part] as TokenGroup;
    }

    // Add token
    if (tokens['default']) {
      currentGroup[tokenName] = tokens['default'];
    }
  }
}
```

***

## Shared Types Example

### src/shared/types/figma-types.ts

```typescript
/**
 * Figma Variable Collection data structure
 */
export interface FigmaCollection {
  id: string;
  name: string;
  modes: FigmaMode[];
  variableIds: string[];
  defaultModeId: string;
}

/**
 * Figma Mode (theme variant like light/dark)
 */
export interface FigmaMode {
  modeId: string;
  name: string;
}

/**
 * Figma Variable structure
 */
export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: VariableResolvedDataType;
  valuesByMode: Record<string, VariableValue>;
  description: string;
  scopes: VariableScope[];
  codeSyntax: Record<string, string>;
}

/**
 * Figma variable value types
 */
export type VariableValue =
  | boolean
  | number
  | string
  | RGB
  | RGBA
  | VariableAlias;

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export type VariableResolvedDataType =
  | 'BOOLEAN'
  | 'COLOR'
  | 'FLOAT'
  | 'STRING';

export type VariableScope =
  | 'ALL_SCOPES'
  | 'TEXT_CONTENT'
  | 'CORNER_RADIUS'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR';

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface RGBA extends RGB {
  a: number; // 0-1
}
```

### src/shared/types/token-types.ts

```typescript
/**
 * W3C Design Token (DTCG 2025.10) structure
 */
export interface DesignToken {
  $value: TokenValue;
  $type: TokenType;
  $description?: string;
  $extensions?: {
    'com.figma': FigmaExtensions;
    [key: string]: unknown;
  };
}

/**
 * Design Token Group (collection)
 */
export interface TokenGroup {
  $type?: TokenType;
  $description?: string;
  $extensions?: {
    'com.figma': FigmaCollectionExtensions;
    [key: string]: unknown;
  };
  [tokenName: string]: DesignToken | TokenGroup | string | undefined;
}

export type TokenValue =
  | string
  | number
  | boolean;

export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'string'
  | 'boolean';

export interface FigmaExtensions {
  variableId: string;
  collectionId: string;
  modeId?: string;
  scopes?: string[];
  codeSyntax?: Record<string, string>;
}

export interface FigmaCollectionExtensions {
  collectionId: string;
  modes: {
    [modeName: string]: {
      modeId: string;
    };
  };
}

export interface TokenFile {
  [collectionName: string]: TokenGroup;
}
```

***

## Test Examples

### test/unit/TypeMapper.test.ts

```typescript
import test from 'ava';
import { TypeMapper } from '../../src/plugin/conversion/TypeMapper';
import type { FigmaVariable } from '../../src/shared/types/figma-types';

test('maps COLOR to color', t => {
  const mapper = new TypeMapper();
  const result = mapper.mapType('COLOR');
  t.is(result, 'color');
});

test('maps FLOAT to number', t => {
  const mapper = new TypeMapper();
  const result = mapper.mapType('FLOAT');
  t.is(result, 'number');
});

test('maps STRING to string', t => {
  const mapper = new TypeMapper();
  const result = mapper.mapType('STRING');
  t.is(result, 'string');
});

test('maps BOOLEAN to boolean', t => {
  const mapper = new TypeMapper();
  const result = mapper.mapType('BOOLEAN');
  t.is(result, 'boolean');
});

test('infers fontFamily from variable name', t => {
  const mapper = new TypeMapper();
  const variable: FigmaVariable = {
    id: '1',
    name: 'font-family/heading',
    resolvedType: 'STRING',
    valuesByMode: {},
    description: '',
    scopes: ['TEXT_CONTENT'],
    codeSyntax: {}
  };

  const result = mapper.inferSpecificType(variable, 'string');
  t.is(result, 'fontFamily');
});

test('infers dimension from GAP scope', t => {
  const mapper = new TypeMapper();
  const variable: FigmaVariable = {
    id: '1',
    name: 'spacing/md',
    resolvedType: 'FLOAT',
    valuesByMode: {},
    description: '',
    scopes: ['GAP'],
    codeSyntax: {}
  };

  const result = mapper.inferSpecificType(variable, 'number');
  t.is(result, 'dimension');
});

test('infers dimension from variable name containing "spacing"', t => {
  const mapper = new TypeMapper();
  const variable: FigmaVariable = {
    id: '1',
    name: 'spacing-large',
    resolvedType: 'FLOAT',
    valuesByMode: {},
    description: '',
    scopes: ['ALL_SCOPES'],
    codeSyntax: {}
  };

  const result = mapper.inferSpecificType(variable, 'number');
  t.is(result, 'dimension');
});
```

### test/unit/ValueTransformer.test.ts

```typescript
import test from 'ava';
import { ValueTransformer } from '../../src/plugin/conversion/ValueTransformer';

test('transforms RGB to hex', t => {
  const transformer = new ValueTransformer();
  const rgb = { r: 1, g: 0, b: 0 };
  const result = transformer.transformValue(rgb, 'color');
  t.is(result, '#FF0000');
});

test('transforms RGB with partial values to hex', t => {
  const transformer = new ValueTransformer();
  const rgb = { r: 0.2, g: 0.4, b: 0.8 };
  const result = transformer.transformValue(rgb, 'color');
  t.is(result, '#3366CC');
});

test('transforms RGBA with opacity to rgba()', t => {
  const transformer = new ValueTransformer();
  const rgba = { r: 1, g: 0, b: 0, a: 0.5 };
  const result = transformer.transformValue(rgba, 'color');
  t.is(result, 'rgba(255, 0, 0, 0.5)');
});

test('transforms RGBA with full opacity to hex', t => {
  const transformer = new ValueTransformer();
  const rgba = { r: 1, g: 0, b: 0, a: 1 };
  const result = transformer.transformValue(rgba, 'color');
  t.is(result, '#FF0000');
});

test('transforms number to dimension with px', t => {
  const transformer = new ValueTransformer();
  const result = transformer.transformValue(16, 'dimension');
  t.is(result, '16px');
});

test('transforms number to duration with ms', t => {
  const transformer = new ValueTransformer();
  const result = transformer.transformValue(300, 'duration');
  t.is(result, '300ms');
});

test('returns raw number for generic number type', t => {
  const transformer = new ValueTransformer();
  const result = transformer.transformValue(42, 'number');
  t.is(result, 42);
});

test('preserves boolean values', t => {
  const transformer = new ValueTransformer();
  const result = transformer.transformValue(true, 'boolean');
  t.is(result, true);
});

test('preserves string values', t => {
  const transformer = new ValueTransformer();
  const result = transformer.transformValue('Arial', 'fontFamily');
  t.is(result, 'Arial');
});
```

***

## Build Configuration Examples

### vite.ui.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  root: './src/ui',
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: './src/ui/index.html',
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@ui': path.resolve(__dirname, './src/ui')
    }
  }
});
```

### vite.plugin.config.ts

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: './dist',
    emptyOutDir: false,
    lib: {
      entry: './src/plugin/code.ts',
      formats: ['es'],
      fileName: () => 'code.js'
    },
    rollupOptions: {
      external: []
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@plugin': path.resolve(__dirname, './src/plugin')
    }
  }
});
```

***

## HTML Template

### src/ui/index.html

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spectrum Design Tokens Exporter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/ui.tsx"></script>
  </body>
</html>
```

***

## Styling Example

### src/ui/styles/main.css

```css
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-border: #e0e0e0;
  --color-text-primary: #2c2c2c;
  --color-text-secondary: #6e6e6e;
  --color-accent: #0265DC;
  --color-success: #268E6C;
  --color-error: #D7373F;

  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;

  --radius-s: 4px;
  --radius-m: 8px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
  background: var(--color-bg);
}

.plugin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.plugin-header {
  padding: var(--spacing-m);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.plugin-header h1 {
  font-size: 16px;
  font-weight: 600;
}

.plugin-main {
  flex: 1;
  padding: var(--spacing-m);
  overflow-y: auto;
}

/* Collection Selector */
.collection-selector {
  margin-bottom: var(--spacing-l);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-m);
}

.section-header h2 {
  font-size: 14px;
  font-weight: 600;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s);
}

.collection-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-s);
  padding: var(--spacing-m);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-m);
  cursor: pointer;
  transition: all 0.2s;
}

.collection-item:hover {
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.collection-meta {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Button */
.export-button {
  width: 100%;
  padding: var(--spacing-m);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-m);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover:not(:disabled) {
  background: #0056b3;
}

.export-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-m);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-state p {
  margin-bottom: var(--spacing-s);
}
```

***

This example code demonstrates the key architectural patterns and should serve as a reference for the actual implementation. Each component is focused on a single responsibility, types are strictly defined, and the separation between UI and plugin code is clear.
