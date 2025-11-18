# Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Figma Application                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │  Plugin Sandbox  │◄────►│    Plugin UI (iframe) │    │
│  │    (code.js)     │      │      (ui.html)        │    │
│  └──────────────────┘      └──────────────────────┘    │
│           │                          │                   │
│           │ postMessage              │ User Events       │
│           ▼                          ▼                   │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │ Figma Variables  │      │  React Components     │    │
│  │   API Access     │      │   (Collection List)   │    │
│  └──────────────────┘      └──────────────────────┘    │
│           │                                              │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│              Exported Tokens (JSON Files)                │
│          /exported-tokens/[collection-name].json         │
└─────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│         Adobe Spectrum Visualizers & Tools               │
│  • S2 Visualizer       • S2 Tokens Viewer                │
│  • Style Dictionary    • Build System                    │
└─────────────────────────────────────────────────────────┘
```

## Module Architecture

### Backend Modules (Plugin Sandbox)

```
src/plugin/
├── code.ts                 # Main entry point
├── variableScanner.ts      # Scan Figma variables
├── tokenExporter.ts        # Export to file system
└── messageHandler.ts       # Handle UI messages
```

**code.ts** - Main Entry Point

* Initializes plugin
* Sets up message handlers
* Shows UI
* Orchestrates workflow

**variableScanner.ts** - Variable Scanner

* Accesses Figma API to get variable collections
* Extracts collection metadata
* Reads variable values and types
* Detects modes and aliases

**tokenExporter.ts** - Token Exporter

* Converts Figma variables to token format
* Uses mapping logic from `src/mapping/`
* Writes JSON files to disk
* Returns export results

**messageHandler.ts** - Message Handler

* Listens for messages from UI
* Dispatches commands to appropriate modules
* Sends responses back to UI

### UI Modules (Plugin Interface)

```
src/ui/
├── ui.html                 # HTML template
├── ui.ts                   # Main UI logic
└── components/
    ├── CollectionSelector.ts
    ├── ExportSettings.ts
    └── StatusDisplay.ts
```

**ui.html** - HTML Template

* Basic HTML structure
* Includes compiled JavaScript
* Includes styles (inline or linked)

**ui.ts** - Main UI Logic

* Initializes UI
* Manages state
* Sends messages to plugin backend
* Handles responses

**CollectionSelector.ts** - Collection Selector Component

* Displays list of collections
* Handles selection state
* Shows metadata (count, modes)

**ExportSettings.ts** - Export Settings Component

* Configuration options
* Export location display
* Mode selection (future)

**StatusDisplay.ts** - Status Display Component

* Shows progress/loading states
* Displays success/error messages
* Shows export results

### Mapping Modules (Shared Logic)

```
src/mapping/
├── figmaToSpec.ts          # Main conversion logic
├── typeDetector.ts         # Detect token types
├── schemaMapper.ts         # Map to Spectrum schemas
└── aliasResolver.ts        # Resolve alias chains
```

**figmaToSpec.ts** - Figma to Spec Converter

* Main conversion function: `convertVariable()`
* Orchestrates type detection, value conversion, metadata generation
* Returns Design Token format

**typeDetector.ts** - Type Detector

* `detectType(variable)` - Determines token type from Figma variable
* Uses naming conventions and value patterns
* Returns Design Token type string

**schemaMapper.ts** - Schema Mapper

* `getSchemaUrl(type)` - Maps token type to Spectrum schema URL
* Validates schema exists
* Returns full schema URL

**aliasResolver.ts** - Alias Resolver

* `resolveAliases(variables)` - Resolves variable references
* Detects circular references
* Converts to `{token.name}` format

### Utility Modules (Shared Utilities)

```
src/utils/
├── uuid.ts                 # UUID generation
├── validators.ts           # Token validation
├── formatters.ts           # Value formatting
└── fileSystem.ts           # File operations
```

**uuid.ts** - UUID Generator

* Generates v4 UUIDs for tokens
* Ensures uniqueness

**validators.ts** - Validators

* `validateToken()` - Validates token structure
* `validateColor()` - Validates color format
* `validateAlias()` - Validates alias reference

**formatters.ts** - Formatters

* `formatColorValue()` - Converts color to hex
* `formatNumericValue()` - Formats numbers
* `formatTokenName()` - Sanitizes token names

**fileSystem.ts** - File System

* `writeTokenFile()` - Writes JSON to disk
* `checkFileExists()` - Checks for existing files
* `ensureDirectory()` - Creates directory if needed

## Data Flow

### 1. Plugin Initialization

```
User clicks plugin in Figma
    │
    ▼
code.ts loads
    │
    ▼
figma.showUI() displays ui.html
    │
    ▼
ui.ts initializes
    │
    ▼
UI sends "scan-collections" message
```

### 2. Collection Scanning

```
UI sends "scan-collections"
    │
    ▼
messageHandler receives message
    │
    ▼
variableScanner.scanCollections()
    │
    ├─► figma.variables.getLocalVariableCollections()
    ├─► Extract metadata for each collection
    └─► Count variables per collection
    │
    ▼
Send collections data back to UI
    │
    ▼
UI displays collection list
```

### 3. Token Export

```
User selects collections and clicks "Export"
    │
    ▼
UI sends "export-tokens" message with selection
    │
    ▼
messageHandler receives message
    │
    ▼
tokenExporter.export(selectedCollections)
    │
    ├─► For each collection:
    │   ├─► Get all variables
    │   ├─► For each variable:
    │   │   ├─► typeDetector.detectType()
    │   │   ├─► figmaToSpec.convertVariable()
    │   │   ├─► schemaMapper.getSchemaUrl()
    │   │   ├─► uuid.generate()
    │   │   └─► validators.validateToken()
    │   └─► Collect all tokens
    │
    ├─► aliasResolver.resolveAliases()
    │
    ├─► formatters.formatOutput()
    │
    └─► fileSystem.writeTokenFile()
    │
    ▼
Send success/error back to UI
    │
    ▼
UI displays result message
```

## Message Protocol

### UI → Plugin Messages

```typescript
// Scan collections
{
  type: 'scan-collections'
}

// Export tokens
{
  type: 'export-tokens',
  payload: {
    collectionIds: string[],
    options: {
      includePrivate: boolean,
      exportLocation: string
    }
  }
}

// Cancel operation
{
  type: 'cancel'
}
```

### Plugin → UI Messages

```typescript
// Collections scanned
{
  type: 'collections-scanned',
  payload: {
    collections: Array<{
      id: string,
      name: string,
      variableCount: number,
      modes: Array<{
        modeId: string,
        name: string
      }>
    }>
  }
}

// Export progress
{
  type: 'export-progress',
  payload: {
    current: number,
    total: number,
    message: string
  }
}

// Export complete
{
  type: 'export-complete',
  payload: {
    success: true,
    files: Array<{
      name: string,
      path: string,
      tokenCount: number
    }>
  }
}

// Export error
{
  type: 'export-error',
  payload: {
    success: false,
    error: string,
    details?: any
  }
}
```

## Type System

### Core Types

```typescript
// Figma variable data
interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: { [modeId: string]: VariableValue };
  description?: string;
  scopes?: VariableScope[];
}

// Design token output
interface DesignToken {
  $value: string | number | object;
  $type?: string;
  $description?: string;
  $schema: string;
  uuid: string;
  component?: string;
  deprecated?: boolean;
  private?: boolean;
}

// Token collection
interface TokenCollection {
  [tokenName: string]: DesignToken;
}

// Export result
interface ExportResult {
  success: boolean;
  files?: ExportedFile[];
  error?: string;
  warnings?: string[];
}

interface ExportedFile {
  name: string;
  path: string;
  tokenCount: number;
}
```

## Build Process

### Development Build

```
pnpm watch
    │
    ├─► esbuild src/plugin/code.ts → dist/code.js
    │   ├─► Bundle with dependencies
    │   ├─► Generate source maps
    │   └─► Watch for changes
    │
    └─► esbuild src/ui/ui.ts → dist/ui.js
        ├─► Bundle with dependencies
        ├─► Inline into ui.html
        ├─► Generate source maps
        └─► Watch for changes
```

### Production Build

```
pnpm build
    │
    ├─► esbuild src/plugin/code.ts → dist/code.js
    │   ├─► Bundle with dependencies
    │   ├─► Minify
    │   └─► No source maps
    │
    └─► esbuild src/ui/ui.ts → dist/ui.js
        ├─► Bundle with dependencies
        ├─► Minify
        ├─► Inline into ui.html
        └─► No source maps
```

### Build Configuration

```javascript
// build.js
import esbuild from 'esbuild';

// Plugin code bundle
await esbuild.build({
  entryPoints: ['src/plugin/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  format: 'iife',
  target: 'es2020',
  minify: production,
  sourcemap: !production,
});

// UI bundle
await esbuild.build({
  entryPoints: ['src/ui/ui.ts'],
  bundle: true,
  outfile: 'dist/ui.js',
  format: 'iife',
  target: 'es2020',
  minify: production,
  sourcemap: !production,
});
```

## Testing Strategy

### Unit Tests

```
test/
├── mapping/
│   ├── figmaToSpec.test.ts
│   ├── typeDetector.test.ts
│   └── aliasResolver.test.ts
│
├── utils/
│   ├── validators.test.ts
│   ├── formatters.test.ts
│   └── uuid.test.ts
│
└── plugin/
    └── variableScanner.test.ts
```

### Test Structure

```typescript
import test from 'ava';
import { detectType } from '../src/mapping/typeDetector.js';

test('detects color type from COLOR variable', t => {
  const variable = {
    resolvedType: 'COLOR',
    name: 'primary-color',
  };

  const type = detectType(variable);
  t.is(type, 'color');
});

test('detects dimension from FLOAT with size keyword', t => {
  const variable = {
    resolvedType: 'FLOAT',
    name: 'button-size',
  };

  const type = detectType(variable);
  t.is(type, 'dimension');
});
```

### Integration Tests

```typescript
test('exports collection to valid Design Tokens format', async t => {
  const mockCollection = createMockCollection();
  const result = await exportTokens([mockCollection.id]);

  t.true(result.success);
  t.is(result.files.length, 1);

  const tokens = JSON.parse(fs.readFileSync(result.files[0].path));
  t.true(validateDesignTokens(tokens));
});
```

## Security Considerations

### Figma Plugin Sandbox

* Plugin code runs in restricted sandbox
* No access to network (networkAccess: none)
* No access to external scripts
* Limited file system access via Figma API

### Data Privacy

* No data sent to external servers
* All processing happens locally
* No analytics or tracking
* No user data collection

### File System Safety

* Export only to designated directory
* Validate file paths to prevent traversal
* Confirm before overwriting existing files
* Handle write errors gracefully

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   * Load collections only when needed
   * Defer non-critical operations

2. **Batch Processing**
   * Process variables in batches
   * Avoid blocking main thread

3. **Efficient Data Structures**
   * Use Maps for O(1) lookups
   * Minimize array iterations

4. **Caching**
   * Cache collection metadata
   * Reuse type detection results

### Performance Targets

* Scan 100 collections: <1 second
* Export 1000 tokens: <3 seconds
* UI response time: <100ms
* Memory usage: <50MB

## Extensibility

### Plugin Architecture

The plugin is designed for future extensibility:

1. **Modular Design**
   * Each module has single responsibility
   * Clean interfaces between modules
   * Easy to add new token types

2. **Configuration**
   * Externalize type detection rules
   * Configurable schema mappings
   * Pluggable formatters

3. **Future Features**
   * Multi-file export formats (YAML, TypeScript)
   * Custom token transformations
   * Direct integration with build systems
   * Bi-directional sync

### Extension Points

```typescript
// Custom type detector
interface TypeDetector {
  detect(variable: FigmaVariable): string | null;
}

// Custom formatter
interface TokenFormatter {
  format(tokens: TokenCollection): string;
}

// Custom exporter
interface TokenExporter {
  export(tokens: TokenCollection, options: ExportOptions): Promise<ExportResult>;
}
```

## Deployment

### Plugin Installation

1. Build plugin: `pnpm build`
2. In Figma: Plugins → Development → Import plugin from manifest
3. Select `manifest.json` from plugin directory
4. Plugin appears in Plugins menu

### Distribution (Future)

1. Publish to Figma Community
2. Follow Figma plugin review guidelines
3. Maintain changelog and version history
4. Provide support documentation

## Monitoring & Debugging

### Logging Strategy

```typescript
// Development: Verbose logging
console.log('[Scanner] Found collections:', collections);

// Production: Error logging only
console.error('[Exporter] Failed to write file:', error);
```

### Error Tracking

* Capture errors in try-catch blocks
* Send error details to UI for user feedback
* Log errors to console for debugging
* Include context (variable name, collection, etc.)

### Debug Mode

```typescript
// Enable via environment variable or plugin setting
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug info:', data);
}
```
