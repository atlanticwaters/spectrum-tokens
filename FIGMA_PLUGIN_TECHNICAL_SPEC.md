# Figma to Spectrum Design Tokens Exporter - Technical Specification

**Version:** 1.0.0
**Date:** November 18, 2025
**Status:** Planning Phase

***

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Plugin Structure](#plugin-structure)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [UI/UX Design](#uiux-design)
6. [Figma API Integration](#figma-api-integration)
7. [Token Conversion Logic](#token-conversion-logic)
8. [Export Mechanism](#export-mechanism)
9. [Plugin Configuration](#plugin-configuration)
10. [Build & Development](#build--development)
11. [Testing Strategy](#testing-strategy)
12. [Error Handling](#error-handling)
13. [Future Enhancements](#future-enhancements)

***

## Executive Summary

This specification outlines the architecture and implementation plan for a Figma plugin that exports Figma Variables as W3C Design Tokens Format (DTCG 2025.10) compatible with Adobe Spectrum's design system.

### Goals

* Enable designers to export Figma Variables to standardized Design Tokens format
* Ensure compatibility with Adobe Spectrum token structure and visualizers
* Preserve Figma metadata in token `$extensions` field
* Support multi-mode variables (light/dark themes)
* Provide clear export feedback to users

### Non-Goals (Phase 1)

* Bidirectional sync (import tokens back to Figma)
* Real-time synchronization
* Cloud storage integration
* Version control integration

***

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FIGMA PLUGIN                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐              ┌────────────────────┐    │
│  │   UI Layer     │◄────────────►│   Code Layer       │    │
│  │  (HTML/React)  │ postMessage  │   (TypeScript)     │    │
│  └────────────────┘              └────────────────────┘    │
│         │                                  │                │
│         │                                  │                │
│         ▼                                  ▼                │
│  ┌────────────────┐              ┌────────────────────┐    │
│  │  UI Components │              │  Figma API Layer   │    │
│  │  - Collection  │              │  - Variables       │    │
│  │    Selector    │              │  - Collections     │    │
│  │  - Settings    │              │  - Modes           │    │
│  │  - Progress    │              └────────────────────┘    │
│  │  - Results     │                        │                │
│  └────────────────┘                        ▼                │
│                                   ┌────────────────────┐    │
│                                   │ Conversion Engine  │    │
│                                   │ - Type Mapping     │    │
│                                   │ - Value Transform  │    │
│                                   │ - Alias Resolution │    │
│                                   └────────────────────┘    │
│                                            │                │
│                                            ▼                │
│                                   ┌────────────────────┐    │
│                                   │  Export Handler    │    │
│                                   │ - File Generation  │    │
│                                   │ - Validation       │    │
│                                   │ - Download         │    │
│                                   └────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
                ┌──────────────────┐
                │  Design Tokens   │
                │   JSON Files     │
                └──────────────────┘
                          │
                          ▼
          ┌───────────────────────────────┐
          │   Spectrum Visualizers        │
          │   - visualizer/               │
          │   - s2-visualizer/            │
          │   - s2-tokens-viewer/         │
          └───────────────────────────────┘
```

### Separation of Concerns

1. **UI Layer (iframe)**: User interaction, display, configuration
2. **Code Layer (sandbox)**: Figma API access, business logic
3. **Conversion Engine**: Figma Variables → Design Tokens transformation
4. **Export Handler**: File generation and user feedback

***

## Plugin Structure

### Directory Structure

```
figma-spectrum-tokens-exporter/
├── manifest.json                 # Figma plugin manifest
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── moon.yml                      # Moon task definitions
├── ava.config.js                 # AVA test configuration
├── .changeset/                   # Changeset files
│
├── src/
│   ├── ui/                       # UI Layer (runs in iframe)
│   │   ├── index.html           # Plugin UI entry point
│   │   ├── ui.tsx               # React UI components
│   │   ├── components/
│   │   │   ├── CollectionSelector.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── ExportResults.tsx
│   │   │   └── ErrorDisplay.tsx
│   │   └── styles/
│   │       ├── main.css
│   │       └── spectrum-theme.css
│   │
│   ├── plugin/                   # Code Layer (runs in sandbox)
│   │   ├── code.ts              # Main plugin code entry
│   │   ├── api/
│   │   │   ├── FigmaVariablesAPI.ts      # Figma API wrapper
│   │   │   ├── CollectionReader.ts       # Read collections
│   │   │   └── VariableResolver.ts       # Resolve references
│   │   ├── conversion/
│   │   │   ├── TokenConverter.ts         # Main converter
│   │   │   ├── TypeMapper.ts             # Figma → DTCG type mapping
│   │   │   ├── ValueTransformer.ts       # Value conversion
│   │   │   ├── AliasResolver.ts          # Handle variable refs
│   │   │   └── ModeHandler.ts            # Multi-mode support
│   │   ├── export/
│   │   │   ├── FileGenerator.ts          # Generate JSON files
│   │   │   ├── Validator.ts              # Validate output
│   │   │   └── Formatter.ts              # Format/prettify JSON
│   │   └── utils/
│   │       ├── uuid.ts                   # UUID generation
│   │       ├── logger.ts                 # Logging utility
│   │       └── error-handler.ts          # Error handling
│   │
│   ├── shared/                   # Shared code (UI + Plugin)
│   │   ├── types/
│   │   │   ├── figma-types.ts           # Figma data types
│   │   │   ├── token-types.ts           # DTCG token types
│   │   │   ├── plugin-messages.ts       # Message types
│   │   │   └── config-types.ts          # Config types
│   │   └── constants/
│   │       ├── message-types.ts         # Message type constants
│   │       └── defaults.ts              # Default values
│   │
│   └── test/                     # Test files
│       ├── unit/
│       │   ├── TokenConverter.test.ts
│       │   ├── TypeMapper.test.ts
│       │   ├── ValueTransformer.test.ts
│       │   └── AliasResolver.test.ts
│       └── fixtures/
│           ├── sample-collections.json
│           ├── sample-variables.json
│           └── expected-output.json
│
├── dist/                         # Build output
│   ├── code.js                  # Compiled plugin code
│   └── ui.html                  # Bundled UI
│
└── README.md                     # Plugin documentation
```

### File Responsibilities

#### UI Layer (`src/ui/`)

* **index.html**: HTML structure, loads React app
* **ui.tsx**: Main React component orchestration
* **CollectionSelector.tsx**: Display and select variable collections
* **SettingsPanel.tsx**: Export configuration options
* **ProgressIndicator.tsx**: Show export progress
* **ExportResults.tsx**: Display export success/location
* **ErrorDisplay.tsx**: Show errors to user

#### Code Layer (`src/plugin/`)

* **code.ts**: Plugin lifecycle, message handling
* **FigmaVariablesAPI.ts**: Abstract Figma API calls
* **CollectionReader.ts**: Read collections and metadata
* **VariableResolver.ts**: Resolve variable references/aliases
* **TokenConverter.ts**: Orchestrate conversion process
* **TypeMapper.ts**: Map Figma variable types to DTCG types
* **ValueTransformer.ts**: Transform Figma values to token values
* **AliasResolver.ts**: Convert Figma references to token aliases
* **ModeHandler.ts**: Handle light/dark/custom modes
* **FileGenerator.ts**: Create JSON output files
* **Validator.ts**: Validate token structure
* **Formatter.ts**: Format JSON output

#### Shared (`src/shared/`)

* **types/**: TypeScript interfaces and types
* **constants/**: Shared constants and enums

***

## TypeScript Interfaces

### Core Data Types

```typescript
// src/shared/types/figma-types.ts

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

/**
 * RGB color structure
 */
export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

/**
 * RGBA color structure
 */
export interface RGBA extends RGB {
  a: number; // 0-1
}
```

```typescript
// src/shared/types/token-types.ts

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

/**
 * Token value types
 */
export type TokenValue =
  | string  // colors, dimensions, font families, etc.
  | number  // numbers, opacity
  | boolean // boolean values
  | TokenAlias; // reference to another token

/**
 * Token alias (reference)
 */
export interface TokenAlias {
  $value: string; // e.g., "{color.primary}"
}

/**
 * Supported token types (DTCG spec)
 */
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

/**
 * Figma-specific metadata stored in $extensions
 */
export interface FigmaExtensions {
  variableId: string;
  collectionId: string;
  modeId?: string;
  scopes?: VariableScope[];
  codeSyntax?: Record<string, string>;
}

/**
 * Figma collection metadata
 */
export interface FigmaCollectionExtensions {
  collectionId: string;
  modes: {
    [modeName: string]: {
      modeId: string;
    };
  };
}

/**
 * Complete token file structure
 */
export interface TokenFile {
  [collectionName: string]: TokenGroup;
}
```

```typescript
// src/shared/types/plugin-messages.ts

/**
 * Message types for UI ↔ Plugin communication
 */
export enum MessageType {
  // UI → Plugin
  FETCH_COLLECTIONS = 'fetch-collections',
  EXPORT_TOKENS = 'export-tokens',
  CANCEL_EXPORT = 'cancel-export',

  // Plugin → UI
  COLLECTIONS_LOADED = 'collections-loaded',
  EXPORT_PROGRESS = 'export-progress',
  EXPORT_SUCCESS = 'export-success',
  EXPORT_ERROR = 'export-error',
  VALIDATION_ERROR = 'validation-error',
}

/**
 * Base message interface
 */
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

/**
 * UI requests collections
 */
export interface FetchCollectionsMessage extends BaseMessage {
  type: MessageType.FETCH_COLLECTIONS;
}

/**
 * Plugin sends collections to UI
 */
export interface CollectionsLoadedMessage extends BaseMessage {
  type: MessageType.COLLECTIONS_LOADED;
  collections: CollectionSummary[];
}

export interface CollectionSummary {
  id: string;
  name: string;
  variableCount: number;
  modes: {
    id: string;
    name: string;
  }[];
}

/**
 * UI requests token export
 */
export interface ExportTokensMessage extends BaseMessage {
  type: MessageType.EXPORT_TOKENS;
  config: ExportConfig;
}

export interface ExportConfig {
  collectionIds: string[];
  includeModes: boolean;
  generateUUIDs: boolean;
  includeDescriptions: boolean;
  fileNamingStrategy: 'collection-name' | 'custom';
  customFileName?: string;
  outputFormat: 'single-file' | 'per-collection';
}

/**
 * Plugin sends export progress
 */
export interface ExportProgressMessage extends BaseMessage {
  type: MessageType.EXPORT_PROGRESS;
  progress: number; // 0-100
  status: string;
  currentCollection?: string;
}

/**
 * Plugin sends export success
 */
export interface ExportSuccessMessage extends BaseMessage {
  type: MessageType.EXPORT_SUCCESS;
  files: ExportedFile[];
  totalTokens: number;
}

export interface ExportedFile {
  fileName: string;
  tokenCount: number;
  size: number; // bytes
}

/**
 * Plugin sends export error
 */
export interface ExportErrorMessage extends BaseMessage {
  type: MessageType.EXPORT_ERROR;
  error: string;
  details?: string;
  recoverable: boolean;
}

/**
 * All message types union
 */
export type PluginMessage =
  | FetchCollectionsMessage
  | CollectionsLoadedMessage
  | ExportTokensMessage
  | ExportProgressMessage
  | ExportSuccessMessage
  | ExportErrorMessage;
```

```typescript
// src/shared/types/config-types.ts

/**
 * Plugin configuration
 */
export interface PluginConfig {
  version: string;
  defaultExportConfig: ExportConfig;
  maxCollectionsPerExport: number;
  fileExtension: '.json' | '.tokens.json';
  includeTimestamp: boolean;
}

/**
 * User preferences (stored in clientStorage)
 */
export interface UserPreferences {
  lastExportConfig: ExportConfig;
  recentExports: RecentExport[];
  favoriteCollections: string[];
}

export interface RecentExport {
  timestamp: number;
  collectionNames: string[];
  tokenCount: number;
}
```

***

## UI/UX Design

### Plugin Window Layout

```
┌─────────────────────────────────────────────┐
│  Spectrum Design Tokens Exporter     [X]    │
├─────────────────────────────────────────────┤
│                                              │
│  Step 1: Select Collections                 │
│  ┌───────────────────────────────────────┐  │
│  │ ☑ Color Tokens (24 variables)        │  │
│  │ ☑ Typography (18 variables)          │  │
│  │ ☐ Spacing (12 variables)             │  │
│  │ ☐ Border Radius (6 variables)        │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Step 2: Export Settings                    │
│  ┌───────────────────────────────────────┐  │
│  │ ☑ Include all modes (light/dark)     │  │
│  │ ☑ Generate UUIDs                      │  │
│  │ ☑ Include descriptions                │  │
│  │                                        │  │
│  │ File Naming:                           │  │
│  │ ⦿ Use collection name                 │  │
│  │ ○ Custom name: [____________]         │  │
│  │                                        │  │
│  │ Output Format:                         │  │
│  │ ⦿ Single file (all collections)       │  │
│  │ ○ Per collection (multiple files)     │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │           [Export Tokens]              │ │
│  └────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

### Export Progress State

```
┌─────────────────────────────────────────────┐
│  Exporting Tokens...                  [X]   │
├─────────────────────────────────────────────┤
│                                              │
│  ████████████████░░░░░░░░░░░░  62%         │
│                                              │
│  Converting Color Tokens collection...      │
│                                              │
│  ✓ Color Tokens (24 tokens)                 │
│  ⟳ Typography (18 tokens)                   │
│  ⏳ Spacing (12 tokens)                      │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │              [Cancel]                  │ │
│  └────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

### Export Success State

```
┌─────────────────────────────────────────────┐
│  Export Complete!                     [X]   │
├─────────────────────────────────────────────┤
│                                              │
│  ✓ Successfully exported 54 tokens          │
│                                              │
│  Files Generated:                           │
│  ┌───────────────────────────────────────┐  │
│  │ 📄 spectrum-tokens.json (12.4 KB)    │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  The file has been saved and is ready      │
│  to download.                               │
│                                              │
│  Next Steps:                                │
│  • Open Spectrum Token Visualizer          │
│  • Import into your design system          │
│  • Share with your team                    │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │            [Export Again]              │ │
│  └────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────┐
│  Export Failed                        [X]   │
├─────────────────────────────────────────────┤
│                                              │
│  ⚠️ Unable to export tokens                 │
│                                              │
│  Error: No variables found in selected     │
│  collections.                               │
│                                              │
│  Suggestions:                               │
│  • Check that collections contain          │
│    variables                                │
│  • Ensure you have access to the file      │
│  • Try selecting different collections     │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │          [Try Again]                   │ │
│  └────────────────────────────────────────┘ │
│                                              │
└─────────────────────────────────────────────┘
```

### User Interaction Flow

1. **Plugin Opens**
   * Plugin fetches variable collections from Figma
   * Displays collections with metadata (count, modes)
   * User sees loading state during fetch

2. **User Selects Collections**
   * User checks/unchecks collections to export
   * Collection count and variable count update dynamically
   * Validation: At least one collection must be selected

3. **User Configures Settings**
   * User adjusts export settings (modes, UUIDs, etc.)
   * Settings are persisted to user preferences
   * Defaults are pre-populated from last export

4. **User Clicks Export**
   * UI validates selections
   * UI sends `ExportTokensMessage` to plugin code
   * Progress state is displayed

5. **Export Processing**
   * Plugin processes collections sequentially
   * Progress updates sent to UI
   * UI shows current collection being processed

6. **Export Complete**
   * Success state displayed
   * File download initiated automatically
   * User can export again or close plugin

7. **Error Handling**
   * Errors displayed with actionable suggestions
   * User can retry or adjust selections
   * Detailed error info logged to console

***

## Figma API Integration

### API Wrapper: FigmaVariablesAPI

```typescript
// src/plugin/api/FigmaVariablesAPI.ts

/**
 * Wrapper around Figma Variables API
 * Provides async methods for accessing Figma variables data
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
  async getVariablesInCollection(
    collectionId: string
  ): Promise<FigmaVariable[]> {
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
   * Resolve a variable alias to its value
   */
  async resolveAlias(alias: VariableAlias, modeId: string): Promise<VariableValue> {
    const variable = await figma.variables.getVariableByIdAsync(alias.id);
    if (!variable) {
      throw new Error(`Variable ${alias.id} not found`);
    }

    const value = variable.valuesByMode[modeId];

    // Recursively resolve nested aliases
    if (this.isAlias(value)) {
      return this.resolveAlias(value, modeId);
    }

    return value;
  }

  /**
   * Check if value is an alias
   */
  private isAlias(value: VariableValue): value is VariableAlias {
    return typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS';
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
}
```

### Collection Reader

```typescript
// src/plugin/api/CollectionReader.ts

/**
 * Reads and structures collection data
 */
export class CollectionReader {
  constructor(private api: FigmaVariablesAPI) {}

  /**
   * Get collection summaries for UI
   */
  async getCollectionSummaries(): Promise<CollectionSummary[]> {
    const collections = await this.api.getLocalCollections();

    return collections.map(c => ({
      id: c.id,
      name: c.name,
      variableCount: c.variableIds.length,
      modes: c.modes.map(m => ({
        id: m.modeId,
        name: m.name
      }))
    }));
  }

  /**
   * Get full collection data for export
   */
  async getCollectionData(collectionId: string): Promise<CollectionData> {
    const collections = await this.api.getLocalCollections();
    const collection = collections.find(c => c.id === collectionId);

    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const variables = await this.api.getVariablesInCollection(collectionId);

    return {
      collection,
      variables
    };
  }
}

export interface CollectionData {
  collection: FigmaCollection;
  variables: FigmaVariable[];
}
```

### Variable Resolver

```typescript
// src/plugin/api/VariableResolver.ts

/**
 * Resolves variable references and aliases
 */
export class VariableResolver {
  private variableCache: Map<string, FigmaVariable> = new Map();

  constructor(private api: FigmaVariablesAPI) {}

  /**
   * Build cache of all variables for fast lookup
   */
  async buildCache(collections: FigmaCollection[]): Promise<void> {
    for (const collection of collections) {
      const variables = await this.api.getVariablesInCollection(collection.id);
      for (const variable of variables) {
        this.variableCache.set(variable.id, variable);
      }
    }
  }

  /**
   * Get variable by ID from cache
   */
  getVariable(id: string): FigmaVariable | undefined {
    return this.variableCache.get(id);
  }

  /**
   * Get variable name path for token reference
   * e.g., "color/primary/500" → "{color.primary.500}"
   */
  getVariableReferencePath(variableId: string): string {
    const variable = this.getVariable(variableId);
    if (!variable) {
      throw new Error(`Variable ${variableId} not found in cache`);
    }

    // Convert Figma variable name to token path
    // Figma uses "/" for hierarchy, tokens use "."
    const tokenPath = variable.name.replace(/\//g, '.');
    return `{${tokenPath}}`;
  }

  /**
   * Check if a value is an alias
   */
  isAlias(value: VariableValue): value is VariableAlias {
    return typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS';
  }
}
```

***

## Token Conversion Logic

### Type Mapper

```typescript
// src/plugin/conversion/TypeMapper.ts

/**
 * Maps Figma variable types to DTCG token types
 */
export class TypeMapper {
  /**
   * Map Figma resolved type to DTCG token type
   */
  mapType(figmaType: VariableResolvedDataType): TokenType {
    const typeMap: Record<VariableResolvedDataType, TokenType> = {
      'COLOR': 'color',
      'FLOAT': 'number',
      'STRING': 'string',
      'BOOLEAN': 'boolean'
    };

    return typeMap[figmaType];
  }

  /**
   * Infer more specific type from variable name or scopes
   * e.g., if name contains "font" and type is STRING, return 'fontFamily'
   */
  inferSpecificType(
    variable: FigmaVariable,
    baseType: TokenType
  ): TokenType {
    const nameLower = variable.name.toLowerCase();

    // Font family inference
    if (baseType === 'string' && (
      nameLower.includes('font-family') ||
      nameLower.includes('fontfamily') ||
      variable.scopes.includes('TEXT_CONTENT')
    )) {
      return 'fontFamily';
    }

    // Dimension inference
    if (baseType === 'number' && (
      nameLower.includes('spacing') ||
      nameLower.includes('padding') ||
      nameLower.includes('margin') ||
      nameLower.includes('gap') ||
      nameLower.includes('radius') ||
      variable.scopes.some(s =>
        ['WIDTH_HEIGHT', 'GAP', 'CORNER_RADIUS'].includes(s)
      )
    )) {
      return 'dimension';
    }

    // Duration inference
    if (baseType === 'number' && (
      nameLower.includes('duration') ||
      nameLower.includes('delay') ||
      nameLower.includes('animation')
    )) {
      return 'duration';
    }

    return baseType;
  }
}
```

### Value Transformer

```typescript
// src/plugin/conversion/ValueTransformer.ts

/**
 * Transforms Figma values to DTCG token values
 */
export class ValueTransformer {
  /**
   * Transform a Figma value to token value
   */
  transformValue(
    value: VariableValue,
    type: TokenType
  ): string | number | boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return this.transformNumber(value, type);
    }

    if (typeof value === 'string') {
      return value;
    }

    // RGB/RGBA color
    if (this.isRGB(value) || this.isRGBA(value)) {
      return this.transformColor(value);
    }

    throw new Error(`Unsupported value type: ${typeof value}`);
  }

  /**
   * Transform number based on token type
   */
  private transformNumber(value: number, type: TokenType): string | number {
    if (type === 'dimension') {
      // Convert to pixels (Figma uses px by default)
      return `${value}px`;
    }

    if (type === 'duration') {
      // Convert to milliseconds
      return `${value}ms`;
    }

    // Return raw number for generic number type
    return value;
  }

  /**
   * Transform RGB/RGBA to hex or rgba() string
   */
  private transformColor(color: RGB | RGBA): string {
    if (this.isRGBA(color) && color.a < 1) {
      // Use rgba() for colors with transparency
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      return `rgba(${r}, ${g}, ${b}, ${color.a})`;
    }

    // Use hex for opaque colors
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${this.toHex(r)}${this.toHex(g)}${this.toHex(b)}`;
  }

  /**
   * Convert number to 2-digit hex string
   */
  private toHex(n: number): string {
    return n.toString(16).padStart(2, '0').toUpperCase();
  }

  private isRGB(value: any): value is RGB {
    return value && typeof value === 'object' &&
      'r' in value && 'g' in value && 'b' in value;
  }

  private isRGBA(value: any): value is RGBA {
    return this.isRGB(value) && 'a' in value;
  }
}
```

### Token Converter (Main Orchestrator)

```typescript
// src/plugin/conversion/TokenConverter.ts

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

    // If multiple modes, create tokens for each
    if (this.config.includeModes && collection.modes.length > 1) {
      for (const mode of collection.modes) {
        const value = variable.valuesByMode[mode.modeId];
        const tokenValue = this.getTokenValue(value, specificType, mode.modeId);

        // Create mode-specific token name
        // e.g., "background-color-light" for light mode
        const modeName = mode.name.toLowerCase();
        tokens[modeName] = {
          $value: tokenValue,
          $type: specificType,
          $description: this.config.includeDescriptions
            ? `${variable.description || variable.name} (${mode.name} mode)`
            : undefined,
          $extensions: {
            'com.figma': {
              variableId: variable.id,
              collectionId: collection.id,
              modeId: mode.modeId,
              scopes: variable.scopes,
              codeSyntax: variable.codeSyntax
            }
          }
        };
      }
    } else {
      // Single mode or modes not included
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
    }

    return tokens;
  }

  /**
   * Get token value (handle aliases)
   */
  private getTokenValue(
    value: VariableValue,
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
   * Merge tokens into group hierarchy based on variable name
   * e.g., "color/background/primary" → tokenGroup.color.background.primary
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

    // Add tokens
    if (Object.keys(tokens).length === 1 && tokens['default']) {
      // Single default token - add directly
      currentGroup[tokenName] = tokens['default'];
    } else {
      // Multiple mode tokens - create sub-group
      currentGroup[tokenName] = tokens as any;
    }
  }
}
```

### Mode Handler

```typescript
// src/plugin/conversion/ModeHandler.ts

/**
 * Handles multi-mode variables (light/dark themes)
 */
export class ModeHandler {
  /**
   * Determine mode handling strategy
   */
  getModeStrategy(
    collection: FigmaCollection,
    config: ExportConfig
  ): 'single' | 'multi' | 'sets' {
    if (!config.includeModes) {
      return 'single'; // Only default mode
    }

    if (collection.modes.length <= 1) {
      return 'single';
    }

    // For Spectrum compatibility, use 'sets' for light/dark
    const modeNames = collection.modes.map(m => m.name.toLowerCase());
    if (modeNames.includes('light') && modeNames.includes('dark')) {
      return 'sets';
    }

    return 'multi';
  }

  /**
   * Create token sets for light/dark modes (Spectrum format)
   */
  createTokenSets(
    variable: FigmaVariable,
    collection: FigmaCollection,
    baseType: TokenType
  ): Record<string, any> {
    const lightMode = collection.modes.find(m =>
      m.name.toLowerCase() === 'light'
    );
    const darkMode = collection.modes.find(m =>
      m.name.toLowerCase() === 'dark'
    );

    if (!lightMode || !darkMode) {
      throw new Error('Light and dark modes not found');
    }

    return {
      $schema: 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color-set.json',
      sets: {
        light: {
          $schema: 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/alias.json',
          value: variable.valuesByMode[lightMode.modeId],
          uuid: this.generateUUID()
        },
        dark: {
          $schema: 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/alias.json',
          value: variable.valuesByMode[darkMode.modeId],
          uuid: this.generateUUID()
        }
      }
    };
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
```

***

## Export Mechanism

### File Generator

```typescript
// src/plugin/export/FileGenerator.ts

/**
 * Generates JSON files from token data
 */
export class FileGenerator {
  constructor(
    private formatter: Formatter,
    private config: ExportConfig
  ) {}

  /**
   * Generate files from converted tokens
   */
  generateFiles(
    tokensByCollection: Map<string, TokenGroup>
  ): ExportedFile[] {
    if (this.config.outputFormat === 'single-file') {
      return [this.generateSingleFile(tokensByCollection)];
    } else {
      return this.generateMultipleFiles(tokensByCollection);
    }
  }

  /**
   * Generate single file with all collections
   */
  private generateSingleFile(
    tokensByCollection: Map<string, TokenGroup>
  ): ExportedFile {
    const combined: TokenFile = {};

    for (const [name, tokens] of tokensByCollection) {
      combined[name] = tokens;
    }

    const content = this.formatter.format(combined);
    const fileName = this.getFileName('spectrum-tokens');

    return {
      fileName,
      content,
      tokenCount: this.countTokens(combined),
      size: new Blob([content]).size
    };
  }

  /**
   * Generate separate file per collection
   */
  private generateMultipleFiles(
    tokensByCollection: Map<string, TokenGroup>
  ): ExportedFile[] {
    const files: ExportedFile[] = [];

    for (const [name, tokens] of tokensByCollection) {
      const content = this.formatter.format({ [name]: tokens });
      const fileName = this.getFileName(name);

      files.push({
        fileName,
        content,
        tokenCount: this.countTokens({ [name]: tokens }),
        size: new Blob([content]).size
      });
    }

    return files;
  }

  /**
   * Get file name based on strategy
   */
  private getFileName(baseName: string): string {
    let name: string;

    if (this.config.fileNamingStrategy === 'custom' && this.config.customFileName) {
      name = this.config.customFileName;
    } else {
      // Convert collection name to kebab-case
      name = baseName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Add timestamp if configured
    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString().split('T')[0];
      name = `${name}-${timestamp}`;
    }

    return `${name}${this.config.fileExtension || '.json'}`;
  }

  /**
   * Count tokens recursively
   */
  private countTokens(obj: any): number {
    let count = 0;

    for (const key in obj) {
      if (key.startsWith('$')) continue; // Skip metadata

      const value = obj[key];
      if (value && typeof value === 'object') {
        if ('$value' in value) {
          count++; // This is a token
        } else {
          count += this.countTokens(value); // Recurse into group
        }
      }
    }

    return count;
  }
}

interface ExportedFileData extends ExportedFile {
  content: string;
}
```

### Validator

```typescript
// src/plugin/export/Validator.ts

/**
 * Validates token structure against DTCG spec
 */
export class Validator {
  /**
   * Validate token file structure
   */
  validate(tokenFile: TokenFile): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    this.validateTokenFile(tokenFile, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate entire token file
   */
  private validateTokenFile(
    tokenFile: TokenFile,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    for (const [name, group] of Object.entries(tokenFile)) {
      this.validateGroup(group, name, errors, warnings, [name]);
    }
  }

  /**
   * Validate token group
   */
  private validateGroup(
    group: TokenGroup | DesignToken,
    name: string,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    path: string[]
  ): void {
    // Check for invalid characters in name
    if (/^[$]/.test(name) || /[{}.]/.test(name)) {
      errors.push({
        path: path.join('.'),
        message: `Invalid token name "${name}": cannot start with $ or contain {, }, .`
      });
    }

    // If this is a token (has $value)
    if ('$value' in group) {
      this.validateToken(group as DesignToken, path, errors, warnings);
    } else {
      // It's a group - validate children
      for (const [childName, child] of Object.entries(group)) {
        if (childName.startsWith('$')) continue; // Skip metadata
        this.validateGroup(
          child as TokenGroup | DesignToken,
          childName,
          errors,
          warnings,
          [...path, childName]
        );
      }
    }
  }

  /**
   * Validate individual token
   */
  private validateToken(
    token: DesignToken,
    path: string[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // $value is required
    if (!('$value' in token)) {
      errors.push({
        path: path.join('.'),
        message: 'Missing required $value property'
      });
    }

    // $type should be present or inherited
    if (!('$type' in token)) {
      warnings.push({
        path: path.join('.'),
        message: '$type not specified, must be inherited from group'
      });
    }

    // Validate token value based on type
    if (token.$type && token.$value) {
      this.validateTokenValue(token.$type, token.$value, path, errors);
    }
  }

  /**
   * Validate token value matches type
   */
  private validateTokenValue(
    type: TokenType,
    value: TokenValue,
    path: string[],
    errors: ValidationError[]
  ): void {
    // Type-specific validation
    switch (type) {
      case 'color':
        if (!this.isValidColor(value)) {
          errors.push({
            path: path.join('.'),
            message: `Invalid color value: ${value}`
          });
        }
        break;

      case 'dimension':
        if (typeof value === 'string' && !/^\d+(\.\d+)?(px|rem|em)$/.test(value)) {
          errors.push({
            path: path.join('.'),
            message: `Invalid dimension value: ${value}`
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' && !this.isAlias(value)) {
          errors.push({
            path: path.join('.'),
            message: `Expected number, got ${typeof value}`
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean' && !this.isAlias(value)) {
          errors.push({
            path: path.join('.'),
            message: `Expected boolean, got ${typeof value}`
          });
        }
        break;
    }
  }

  /**
   * Check if value is a valid color
   */
  private isValidColor(value: TokenValue): boolean {
    if (this.isAlias(value)) return true;
    if (typeof value !== 'string') return false;

    // Hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) return true;

    // rgba/rgb
    if (/^rgba?\(/.test(value)) return true;

    return false;
  }

  /**
   * Check if value is an alias
   */
  private isAlias(value: TokenValue): boolean {
    return typeof value === 'string' && /^\{.+\}$/.test(value);
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
}
```

### Formatter

```typescript
// src/plugin/export/Formatter.ts

/**
 * Formats JSON output with consistent style
 */
export class Formatter {
  /**
   * Format token file as JSON string
   */
  format(tokenFile: TokenFile): string {
    return JSON.stringify(tokenFile, null, 2);
  }

  /**
   * Format with custom indentation
   */
  formatCustom(tokenFile: TokenFile, indent: number = 2): string {
    return JSON.stringify(tokenFile, null, indent);
  }

  /**
   * Format compactly (no whitespace)
   */
  formatCompact(tokenFile: TokenFile): string {
    return JSON.stringify(tokenFile);
  }
}
```

***

## Plugin Configuration

### manifest.json

```json
{
  "name": "Spectrum Design Tokens Exporter",
  "id": "spectrum-tokens-exporter",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"],
  "networkAccess": {
    "allowedDomains": ["none"]
  },
  "permissions": [],
  "documentAccess": "current-page",
  "capabilities": [],
  "menu": [
    {
      "name": "Export Design Tokens",
      "command": "export-tokens"
    }
  ]
}
```

### package.json

```json
{
  "name": "@adobe/figma-spectrum-tokens-exporter",
  "version": "1.0.0",
  "description": "Export Figma Variables as W3C Design Tokens compatible with Adobe Spectrum",
  "type": "module",
  "scripts": {
    "build": "pnpm run build:ui && pnpm run build:plugin",
    "build:ui": "vite build --config vite.ui.config.ts",
    "build:plugin": "vite build --config vite.plugin.config.ts",
    "dev": "concurrently \"pnpm run dev:ui\" \"pnpm run dev:plugin\"",
    "dev:ui": "vite build --watch --config vite.ui.config.ts",
    "dev:plugin": "vite build --watch --config vite.plugin.config.ts",
    "test": "pnpm moon run test",
    "type-check": "tsc --noEmit",
    "lint": "prettier --check src/**/*.{ts,tsx}",
    "format": "prettier --write src/**/*.{ts,tsx}"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.100.0",
    "@types/node": "^20.12.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "ava": "^6.2.0",
    "concurrently": "^8.2.2",
    "prettier": "^3.5.3",
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vite-plugin-singlefile": "^2.0.0"
  },
  "engines": {
    "node": "~20.12"
  },
  "license": "Apache-2.0",
  "author": "Adobe",
  "repository": {
    "type": "git",
    "url": "https://github.com/adobe/spectrum-tokens.git",
    "directory": "tools/figma-spectrum-tokens-exporter"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["shared/*"],
      "@ui/*": ["ui/*"],
      "@plugin/*": ["plugin/*"]
    },
    "types": ["@figma/plugin-typings", "node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/test/**/*"]
}
```

### moon.yml

```yaml
# tools/figma-spectrum-tokens-exporter/moon.yml

type: tool
language: typescript
platform: node

tasks:
  build:
    command: [pnpm, build]
    platform: node
    outputs:
      - dist/

  dev:
    command: [pnpm, dev]
    platform: node
    local: true

  test:
    command: [pnpm, ava, test]
    platform: node
    inputs:
      - src/**/*
      - test/**/*

  type-check:
    command: [pnpm, type-check]
    platform: node
    inputs:
      - src/**/*.ts
      - src/**/*.tsx

  lint:
    command: [pnpm, lint]
    platform: node
    inputs:
      - src/**/*.ts
      - src/**/*.tsx

  format:
    command: [pnpm, format]
    platform: node
    local: true
```

### ava.config.js

```javascript
export default {
  files: ["test/**/*.test.ts"],
  extensions: {
    ts: "module"
  },
  nodeArguments: ["--loader=tsx"],
  environmentVariables: {
    NODE_ENV: "test",
  },
  verbose: true,
  failFast: false,
  failWithoutAssertions: true,
};
```

***

## Build & Development

### Build Configuration

#### vite.ui.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
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

#### vite.plugin.config.ts

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

### Development Workflow

1. **Setup**
   ```bash
   cd tools/figma-spectrum-tokens-exporter
   pnpm install
   ```

2. **Development Mode**
   ```bash
   pnpm dev
   ```
   * Watches for file changes
   * Rebuilds automatically
   * Hot reload in Figma (manual plugin refresh)

3. **Build for Production**
   ```bash
   pnpm moon run :build
   ```

4. **Type Checking**
   ```bash
   pnpm type-check
   ```

5. **Testing**
   ```bash
   pnpm moon run :test
   ```

6. **Formatting**
   ```bash
   pnpm format
   ```

### Figma Plugin Development

1. **Load Plugin in Figma**
   * Open Figma
   * Plugins → Development → Import plugin from manifest
   * Select `manifest.json` from project root
   * Plugin appears in Plugins menu

2. **Debug Plugin**
   * Open Figma Console (Plugins → Development → Open Console)
   * View logs from plugin code
   * UI can be debugged in browser DevTools (right-click UI → Inspect)

3. **Hot Reload**
   * After code changes, rebuild with `pnpm dev`
   * In Figma, run plugin again to see changes
   * No need to reimport manifest

***

## Testing Strategy

### Unit Tests

```typescript
// test/unit/TypeMapper.test.ts

import test from 'ava';
import { TypeMapper } from '@plugin/conversion/TypeMapper';

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

test('infers fontFamily from variable name', t => {
  const mapper = new TypeMapper();
  const variable = {
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

test('infers dimension from variable scopes', t => {
  const mapper = new TypeMapper();
  const variable = {
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
```

```typescript
// test/unit/ValueTransformer.test.ts

import test from 'ava';
import { ValueTransformer } from '@plugin/conversion/ValueTransformer';

test('transforms RGB to hex', t => {
  const transformer = new ValueTransformer();
  const rgb = { r: 1, g: 0, b: 0 };
  const result = transformer.transformValue(rgb, 'color');
  t.is(result, '#FF0000');
});

test('transforms RGBA with opacity to rgba()', t => {
  const transformer = new ValueTransformer();
  const rgba = { r: 1, g: 0, b: 0, a: 0.5 };
  const result = transformer.transformValue(rgba, 'color');
  t.is(result, 'rgba(255, 0, 0, 0.5)');
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
```

```typescript
// test/unit/Validator.test.ts

import test from 'ava';
import { Validator } from '@plugin/export/Validator';

test('validates valid token file', t => {
  const validator = new Validator();
  const tokenFile = {
    colors: {
      primary: {
        $value: '#FF0000',
        $type: 'color'
      }
    }
  };

  const result = validator.validate(tokenFile);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test('detects missing $value', t => {
  const validator = new Validator();
  const tokenFile = {
    colors: {
      primary: {
        $type: 'color'
      }
    }
  };

  const result = validator.validate(tokenFile);
  t.false(result.valid);
  t.is(result.errors.length, 1);
  t.regex(result.errors[0].message, /missing.*\$value/i);
});

test('detects invalid color value', t => {
  const validator = new Validator();
  const tokenFile = {
    colors: {
      primary: {
        $value: 'not-a-color',
        $type: 'color'
      }
    }
  };

  const result = validator.validate(tokenFile);
  t.false(result.valid);
  t.truthy(result.errors.find(e => e.message.includes('Invalid color')));
});
```

### Integration Tests

```typescript
// test/integration/TokenConverter.test.ts

import test from 'ava';
import { TokenConverter } from '@plugin/conversion/TokenConverter';
import { TypeMapper } from '@plugin/conversion/TypeMapper';
import { ValueTransformer } from '@plugin/conversion/ValueTransformer';
import { VariableResolver } from '@plugin/api/VariableResolver';
import sampleCollection from '../fixtures/sample-collection.json';

test('converts collection to token group', async t => {
  const typeMapper = new TypeMapper();
  const valueTransformer = new ValueTransformer();
  const resolver = new VariableResolver(null as any);
  const config = {
    includeModes: false,
    generateUUIDs: true,
    includeDescriptions: true,
    fileNamingStrategy: 'collection-name' as const,
    outputFormat: 'single-file' as const
  };

  const converter = new TokenConverter(
    typeMapper,
    valueTransformer,
    resolver,
    config
  );

  const result = await converter.convertCollection(sampleCollection);

  t.truthy(result);
  t.truthy(result.$description);
  t.truthy(result.$extensions);
  t.is(result.$extensions['com.figma'].collectionId, sampleCollection.collection.id);
});
```

### Test Fixtures

```json
// test/fixtures/sample-collection.json

{
  "collection": {
    "id": "VariableCollectionId:1234",
    "name": "Color Tokens",
    "modes": [
      {
        "modeId": "1:0",
        "name": "Light"
      },
      {
        "modeId": "1:1",
        "name": "Dark"
      }
    ],
    "variableIds": ["VariableID:1", "VariableID:2"],
    "defaultModeId": "1:0"
  },
  "variables": [
    {
      "id": "VariableID:1",
      "name": "color/primary/500",
      "resolvedType": "COLOR",
      "valuesByMode": {
        "1:0": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 },
        "1:1": { "r": 0.3, "g": 0.5, "b": 0.9, "a": 1 }
      },
      "description": "Primary brand color",
      "scopes": ["ALL_FILLS"],
      "codeSyntax": {}
    },
    {
      "id": "VariableID:2",
      "name": "spacing/md",
      "resolvedType": "FLOAT",
      "valuesByMode": {
        "1:0": 16,
        "1:1": 16
      },
      "description": "Medium spacing",
      "scopes": ["GAP"],
      "codeSyntax": {}
    }
  ]
}
```

### Testing Coverage Goals

* **Unit Tests**: 80%+ code coverage
* **Integration Tests**: Cover all major conversion paths
* **E2E Tests**: Manual testing in Figma (automated E2E not feasible)

***

## Error Handling

### Error Types

```typescript
// src/shared/types/error-types.ts

export enum ErrorCode {
  // API Errors
  API_NO_COLLECTIONS = 'API_NO_COLLECTIONS',
  API_COLLECTION_NOT_FOUND = 'API_COLLECTION_NOT_FOUND',
  API_VARIABLE_NOT_FOUND = 'API_VARIABLE_NOT_FOUND',
  API_PERMISSION_DENIED = 'API_PERMISSION_DENIED',

  // Conversion Errors
  CONVERSION_TYPE_UNKNOWN = 'CONVERSION_TYPE_UNKNOWN',
  CONVERSION_VALUE_INVALID = 'CONVERSION_VALUE_INVALID',
  CONVERSION_ALIAS_UNRESOLVED = 'CONVERSION_ALIAS_UNRESOLVED',

  // Export Errors
  EXPORT_VALIDATION_FAILED = 'EXPORT_VALIDATION_FAILED',
  EXPORT_FILE_GENERATION_FAILED = 'EXPORT_FILE_GENERATION_FAILED',
  EXPORT_NO_TOKENS = 'EXPORT_NO_TOKENS',

  // User Input Errors
  INPUT_NO_COLLECTIONS_SELECTED = 'INPUT_NO_COLLECTIONS_SELECTED',
  INPUT_INVALID_CONFIG = 'INPUT_INVALID_CONFIG',
}

export class PluginError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true,
    public details?: string
  ) {
    super(message);
    this.name = 'PluginError';
  }
}
```

### Error Handler

```typescript
// src/plugin/utils/error-handler.ts

export class ErrorHandler {
  /**
   * Handle error and send to UI
   */
  static handleError(error: unknown): ExportErrorMessage {
    let pluginError: PluginError;

    if (error instanceof PluginError) {
      pluginError = error;
    } else if (error instanceof Error) {
      pluginError = new PluginError(
        ErrorCode.EXPORT_FILE_GENERATION_FAILED,
        error.message,
        false,
        error.stack
      );
    } else {
      pluginError = new PluginError(
        ErrorCode.EXPORT_FILE_GENERATION_FAILED,
        'An unknown error occurred',
        false,
        String(error)
      );
    }

    // Log to console for debugging
    console.error('[Plugin Error]', pluginError);

    return {
      type: MessageType.EXPORT_ERROR,
      timestamp: Date.now(),
      error: pluginError.message,
      details: pluginError.details,
      recoverable: pluginError.recoverable
    };
  }

  /**
   * Create user-friendly error messages
   */
  static getUserMessage(error: PluginError): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.API_NO_COLLECTIONS]:
        'No variable collections found in this file. Please create some variables first.',
      [ErrorCode.API_COLLECTION_NOT_FOUND]:
        'The selected collection could not be found. It may have been deleted.',
      [ErrorCode.INPUT_NO_COLLECTIONS_SELECTED]:
        'Please select at least one collection to export.',
      [ErrorCode.EXPORT_NO_TOKENS]:
        'No tokens were generated. The selected collections may be empty.',
      // ... more user-friendly messages
    };

    return messages[error.code] || error.message;
  }
}
```

### Recovery Strategies

1. **API Errors**: Retry with exponential backoff
2. **Conversion Errors**: Skip problematic tokens, log warnings
3. **Validation Errors**: Show detailed validation report
4. **User Input Errors**: Show validation in UI before export

***

## Future Enhancements

### Phase 2 Features

1. **Bidirectional Sync**
   * Import Design Tokens back to Figma Variables
   * Update existing variables from token files
   * Conflict resolution UI

2. **Advanced Export Options**
   * Export to multiple formats (CSS, SCSS, JS)
   * Custom token transformations
   * Token filtering by scope/type

3. **Cloud Integration**
   * Save directly to GitHub
   * Integration with design system repositories
   * Version control for token exports

4. **Collaboration Features**
   * Share export configurations
   * Team presets
   * Export history tracking

5. **Advanced Mode Handling**
   * Support for custom mode names
   * Mode mapping configurations
   * Conditional token values

6. **Component Token Mapping**
   * Map Figma components to Spectrum component schemas
   * Generate component-specific token files
   * Validate against component schemas

7. **Batch Operations**
   * Export across multiple Figma files
   * Scheduled exports
   * CLI for automation

***

## Appendix

### Example Output

#### Input: Figma Variable Collection

```
Collection: "Color Tokens"
Modes: Light, Dark

Variables:
- color/primary/500
  - Light: rgb(51, 102, 204)
  - Dark: rgb(76, 127, 229)
  - Description: "Primary brand color"

- color/background
  - Light: alias → color/neutral/100
  - Dark: alias → color/neutral/900
```

#### Output: Design Tokens JSON

```json
{
  "color-tokens": {
    "$description": "Tokens from Figma collection: Color Tokens",
    "$extensions": {
      "com.figma": {
        "collectionId": "VariableCollectionId:1234",
        "modes": {
          "Light": { "modeId": "1:0" },
          "Dark": { "modeId": "1:1" }
        }
      }
    },
    "color": {
      "primary": {
        "500": {
          "light": {
            "$value": "#3366CC",
            "$type": "color",
            "$description": "Primary brand color (Light mode)",
            "$extensions": {
              "com.figma": {
                "variableId": "VariableID:1",
                "collectionId": "VariableCollectionId:1234",
                "modeId": "1:0",
                "scopes": ["ALL_FILLS"]
              }
            }
          },
          "dark": {
            "$value": "#4C7FE5",
            "$type": "color",
            "$description": "Primary brand color (Dark mode)",
            "$extensions": {
              "com.figma": {
                "variableId": "VariableID:1",
                "collectionId": "VariableCollectionId:1234",
                "modeId": "1:1",
                "scopes": ["ALL_FILLS"]
              }
            }
          }
        }
      },
      "background": {
        "light": {
          "$value": "{color.neutral.100}",
          "$type": "color",
          "$extensions": {
            "com.figma": {
              "variableId": "VariableID:2",
              "collectionId": "VariableCollectionId:1234",
              "modeId": "1:0"
            }
          }
        },
        "dark": {
          "$value": "{color.neutral.900}",
          "$type": "color",
          "$extensions": {
            "com.figma": {
              "variableId": "VariableID:2",
              "collectionId": "VariableCollectionId:1234",
              "modeId": "1:1"
            }
          }
        }
      }
    }
  }
}
```

### References

* [W3C Design Tokens Format Specification (DTCG 2025.10)](https://www.designtokens.org/tr/drafts/format/)
* [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
* [Figma Variables API](https://www.figma.com/plugin-docs/working-with-variables/)
* [Adobe Spectrum Design System](https://spectrum.adobe.com/)
* [Spectrum Tokens Repository](https://github.com/adobe/spectrum-tokens)
* [Style Dictionary (DTCG Support)](https://styledictionary.com/info/dtcg/)

***

**Document Version:** 1.0.0
**Last Updated:** November 18, 2025
**Next Review:** After Phase 1 Implementation

***
