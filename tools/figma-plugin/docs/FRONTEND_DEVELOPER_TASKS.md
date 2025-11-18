# Frontend Developer Tasks

## Overview

You are responsible for building the Figma plugin's infrastructure, UI, and interaction layer. This includes the plugin backend (sandbox), UI frontend (iframe), build system, and testing.

## Your Responsibilities

1. Build system setup with esbuild
2. Plugin backend implementation (Figma API integration)
3. Plugin UI implementation (HTML/CSS/JS)
4. Communication layer between UI and backend
5. File system operations
6. Testing and debugging

## Phase 1: Build System Setup

### Task 1.1: Create esbuild Configuration

**File:** `/tools/figma-plugin/build.js`

**Requirements:**

* Create two build targets:
  1. Plugin code: `src/plugin/code.ts` → `dist/code.js`
  2. UI code: `src/ui/ui.ts` → `dist/ui.js` (inline into `dist/ui.html`)
* Support watch mode for development
* Generate source maps in development
* Minify in production
* TypeScript compilation

**Example:**

```javascript
import esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Build plugin code
await esbuild.build({
  entryPoints: ['src/plugin/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  format: 'iife',
  target: 'es2020',
  minify: production,
  sourcemap: !production,
  watch: watch,
});

// Build UI code
const uiResult = await esbuild.build({
  entryPoints: ['src/ui/ui.ts'],
  bundle: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  minify: production,
  sourcemap: !production,
});

// Inline UI code into HTML
const uiHtml = readFileSync('src/ui/ui.html', 'utf8');
const uiCode = uiResult.outputFiles[0].text;
const finalHtml = uiHtml.replace(
  '<script src="ui.js"></script>',
  `<script>${uiCode}</script>`
);
writeFileSync('dist/ui.html', finalHtml);
```

**Testing:**

* `pnpm build` should create `dist/code.js` and `dist/ui.html`
* `pnpm watch` should rebuild on file changes
* Files should be minified in production mode

### Task 1.2: Add Figma Type Definitions

**File:** `/tools/figma-plugin/types/figma.d.ts`

**Requirements:**

* Add TypeScript definitions for Figma Plugin API
* Include types for:
  * `figma` global object
  * Variable collections and variables
  * UI communication (`figma.ui.postMessage`)
  * File system access

**Resources:**

* <https://www.figma.com/plugin-docs/api/api-reference/>
* Use `@figma/plugin-typings` package if available

## Phase 2: Plugin Backend Implementation

### Task 2.1: Implement Main Plugin Entry Point

**File:** `/tools/figma-plugin/src/plugin/code.ts`

**Requirements:**

* Initialize plugin and show UI
* Set up message handlers for UI communication
* Handle plugin lifecycle (close, etc.)
* Coordinate between modules

**Structure:**

```typescript
// Show UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Spectrum Token Exporter'
});

// Message handler
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'scan-collections':
      const collections = await scanCollections();
      figma.ui.postMessage({
        type: 'collections-scanned',
        payload: { collections }
      });
      break;

    case 'export-tokens':
      const result = await exportTokens(msg.payload);
      figma.ui.postMessage({
        type: 'export-complete',
        payload: result
      });
      break;

    case 'cancel':
      figma.closePlugin();
      break;
  }
};
```

**Testing:**

* Plugin should load in Figma
* UI window should appear
* Messages should be logged to console

### Task 2.2: Implement Variable Scanner

**File:** `/tools/figma-plugin/src/plugin/variableScanner.ts`

**Requirements:**

* Scan all local variable collections
* Extract collection metadata (name, id, modes)
* Count variables in each collection
* Return structured data

**Implementation:**

```typescript
export interface CollectionMetadata {
  id: string;
  name: string;
  variableCount: number;
  modes: Array<{
    modeId: string;
    name: string;
  }>;
}

export async function scanCollections(): Promise<CollectionMetadata[]> {
  const collections = await figma.variables.getLocalVariableCollections();

  return collections.map(collection => {
    const variables = collection.variableIds.length;
    const modes = collection.modes.map(mode => ({
      modeId: mode.modeId,
      name: mode.name
    }));

    return {
      id: collection.id,
      name: collection.name,
      variableCount: variables,
      modes
    };
  });
}
```

**Testing:**

* Create test Figma file with variable collections
* Scanner should find all collections
* Metadata should be accurate

### Task 2.3: Implement Token Exporter

**File:** `/tools/figma-plugin/src/plugin/tokenExporter.ts`

**Requirements:**

* Accept collection IDs to export
* Retrieve all variables from collections
* Convert variables to tokens (use mapping modules)
* Write tokens to JSON files
* Return export results

**Dependencies:**

* Uses `figmaToSpec.convertVariable()` from mapping module
* Uses file system utilities

**Implementation:**

```typescript
import { convertVariable } from '../mapping/figmaToSpec.js';

export interface ExportOptions {
  collectionIds: string[];
  outputPath?: string;
}

export interface ExportResult {
  success: boolean;
  files?: Array<{
    name: string;
    path: string;
    tokenCount: number;
  }>;
  error?: string;
  warnings?: string[];
}

export async function exportTokens(
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const files = [];

    for (const collectionId of options.collectionIds) {
      const collection = await figma.variables.getVariableCollectionById(collectionId);
      const tokens = {};

      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableById(variableId);
        const token = convertVariable(variable, collection.name);
        tokens[variable.name] = token;
      }

      // Write file (implementation depends on Figma API capabilities)
      const fileName = `${sanitizeName(collection.name)}.json`;
      const filePath = `/exported-tokens/${fileName}`;

      // Note: Figma plugins may not have direct file system access
      // May need to use download or copy to clipboard instead
      await writeTokenFile(filePath, tokens);

      files.push({
        name: fileName,
        path: filePath,
        tokenCount: Object.keys(tokens).length
      });
    }

    return {
      success: true,
      files
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

**Note:** Figma plugins may not have direct file system access. You may need to:

* Use `figma.ui.postMessage` to send data to UI
* Use download API to save file
* Copy JSON to clipboard for user to paste

**Testing:**

* Export should create valid JSON files
* File names should be sanitized
* Token count should be accurate

## Phase 3: Plugin UI Implementation

### Task 3.1: Create UI Structure

**File:** `/tools/figma-plugin/src/ui/ui.html`

**Requirements:**

* Clean, minimal HTML structure
* Header with plugin title
* Main content area for collection list
* Footer with action buttons
* Inline styles (external CSS not supported)

**Structure:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Spectrum Token Exporter</title>
  <style>
    /* See UI design guidelines */
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Spectrum Token Exporter</h1>
      <p>Select collections to export as design tokens</p>
    </header>

    <main id="app">
      <div id="loading" class="loading">
        <div class="spinner"></div>
        <p>Scanning variables...</p>
      </div>

      <div id="collection-list" class="hidden">
        <!-- Populated by JavaScript -->
      </div>

      <div id="status" class="hidden">
        <!-- Status messages -->
      </div>
    </main>

    <footer>
      <button id="export-btn" disabled>Export Tokens</button>
      <button id="cancel-btn">Cancel</button>
    </footer>
  </div>

  <script src="ui.js"></script>
</body>
</html>
```

**Styling Guidelines:**

* Use Figma plugin UI conventions
* 8px grid system
* Figma UI colors (grays, blues)
* Standard font sizes (11px, 12px, 14px)

### Task 3.2: Implement UI Logic

**File:** `/tools/figma-plugin/src/ui/ui.ts`

**Requirements:**

* Initialize UI on load
* Request collection scan from plugin
* Display collection list with checkboxes
* Handle user selection
* Send export request to plugin
* Display results/errors

**Implementation:**

```typescript
interface Collection {
  id: string;
  name: string;
  variableCount: number;
  modes: Array<{ modeId: string; name: string }>;
}

let collections: Collection[] = [];
let selectedIds: Set<string> = new Set();

// Initialize
window.addEventListener('load', () => {
  // Request scan
  parent.postMessage({ pluginMessage: { type: 'scan-collections' } }, '*');

  // Set up event listeners
  document.getElementById('export-btn')?.addEventListener('click', handleExport);
  document.getElementById('cancel-btn')?.addEventListener('click', handleCancel);
});

// Handle messages from plugin
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;

  switch (msg.type) {
    case 'collections-scanned':
      collections = msg.payload.collections;
      renderCollections();
      break;

    case 'export-complete':
      showSuccess(msg.payload);
      break;

    case 'export-error':
      showError(msg.payload.error);
      break;
  }
};

function renderCollections() {
  const listEl = document.getElementById('collection-list');
  const loadingEl = document.getElementById('loading');

  if (collections.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No variable collections found</p>';
  } else {
    listEl.innerHTML = collections.map(c => `
      <label class="collection-item">
        <input
          type="checkbox"
          value="${c.id}"
          onchange="handleSelectionChange()"
        />
        <div class="collection-info">
          <div class="collection-name">${c.name}</div>
          <div class="collection-meta">${c.variableCount} variables</div>
        </div>
      </label>
    `).join('');
  }

  loadingEl.classList.add('hidden');
  listEl.classList.remove('hidden');
}

function handleSelectionChange() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  selectedIds.clear();

  checkboxes.forEach((cb: HTMLInputElement) => {
    if (cb.checked) {
      selectedIds.add(cb.value);
    }
  });

  // Enable/disable export button
  const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
  exportBtn.disabled = selectedIds.size === 0;
}

function handleExport() {
  parent.postMessage({
    pluginMessage: {
      type: 'export-tokens',
      payload: {
        collectionIds: Array.from(selectedIds)
      }
    }
  }, '*');

  showLoading('Exporting tokens...');
}

function handleCancel() {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
}
```

**Testing:**

* UI should load and show loading state
* Collections should render after scan
* Selection should enable/disable export button
* Export should trigger backend process

### Task 3.3: Create UI Components (Optional)

**Files:**

* `/tools/figma-plugin/src/ui/components/CollectionSelector.ts`
* `/tools/figma-plugin/src/ui/components/StatusDisplay.ts`

**Requirements:**

* Encapsulate UI logic into reusable components
* Use vanilla JavaScript or lightweight framework
* Keep bundle size small

**Note:** For MVP, inline implementation in `ui.ts` is acceptable. Components can be refactored later.

## Phase 4: Utilities and File System

### Task 4.1: File System Utilities

**File:** `/tools/figma-plugin/src/utils/fileSystem.ts`

**Requirements:**

* Write JSON file to disk (or download)
* Check if file exists
* Handle errors gracefully

**Implementation:**

```typescript
export async function writeTokenFile(
  path: string,
  tokens: object
): Promise<void> {
  const json = JSON.stringify(tokens, null, 2);

  // Option 1: Use Figma's file system API (if available)
  // await figma.saveFile(path, json);

  // Option 2: Trigger download in UI
  parent.postMessage({
    pluginMessage: {
      type: 'download-file',
      payload: {
        filename: path.split('/').pop(),
        content: json
      }
    }
  }, '*');
}
```

**Note:** Research Figma Plugin API capabilities for file system access. May need workaround.

### Task 4.2: Name Sanitization

**File:** `/tools/figma-plugin/src/utils/formatters.ts`

**Requirements:**

* Sanitize collection names for filenames
* Remove special characters
* Replace spaces with hyphens
* Convert to lowercase

**Implementation:**

```typescript
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
```

## Phase 5: Testing

### Task 5.1: Unit Tests

**Files:** `/tools/figma-plugin/test/*.test.ts`

**Requirements:**

* Test file system utilities
* Test name sanitization
* Test message handling logic
* Use AVA framework

**Example:**

```typescript
import test from 'ava';
import { sanitizeName } from '../src/utils/formatters.js';

test('sanitizes collection name', t => {
  t.is(sanitizeName('My Collection'), 'my-collection');
  t.is(sanitizeName('Colors & Spacing'), 'colors-spacing');
  t.is(sanitizeName('Button (Primary)'), 'button-primary');
});
```

### Task 5.2: Integration Testing

**Requirements:**

* Create test Figma file with sample variables
* Test end-to-end export workflow
* Verify exported JSON structure
* Test with different variable types

**Test Cases:**

* Export single collection
* Export multiple collections
* Export empty collection (should handle gracefully)
* Export with aliases
* Export with multiple modes

## Deliverables Checklist

* [ ] Build system (`build.js`) with esbuild
* [ ] Plugin backend (`src/plugin/code.ts`)
* [ ] Variable scanner (`src/plugin/variableScanner.ts`)
* [ ] Token exporter (`src/plugin/tokenExporter.ts`)
* [ ] UI HTML template (`src/ui/ui.html`)
* [ ] UI logic (`src/ui/ui.ts`)
* [ ] File system utilities (`src/utils/fileSystem.ts`)
* [ ] Name sanitization (`src/utils/formatters.ts`)
* [ ] Unit tests with >80% coverage
* [ ] Working plugin loadable in Figma
* [ ] Documentation of any API limitations

## Technical Constraints

1. **Figma Plugin Sandbox**
   * No DOM access in plugin code
   * No Node.js APIs (fs, path, etc.)
   * Limited to Figma Plugin API

2. **UI Iframe**
   * No Figma API access
   * Communication via postMessage only
   * Limited to browser APIs

3. **Bundle Size**
   * Keep bundle small for fast loading
   * Minimize dependencies
   * Tree-shake unused code

4. **File System Access**
   * Research Figma's capabilities
   * May need download workaround
   * Document limitations

## Resources

* [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
* [Figma Plugin Samples](https://github.com/figma/plugin-samples)
* [esbuild Documentation](https://esbuild.github.io/)
* [AVA Test Framework](https://github.com/avajs/ava)

## Questions?

If you encounter issues or need clarification:

1. Check Figma Plugin API documentation
2. Review example plugins in Figma's GitHub
3. Document any blockers or limitations
4. Ask for guidance from Project Manager

## Success Criteria

* Plugin loads without errors in Figma
* Collections are scanned and displayed
* User can select and export collections
* Exported tokens are valid JSON
* UI is responsive and provides clear feedback
* Tests pass with >80% coverage
