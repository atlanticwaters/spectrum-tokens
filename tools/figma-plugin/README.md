# Spectrum Figma Token Exporter

A Figma plugin that exports design tokens from Figma variable collections in a format compatible with Adobe Spectrum's design system tooling.

## Overview

This plugin bridges the gap between Figma design variables and Adobe Spectrum's token ecosystem by:

1. **Scanning** Figma variable collections in your design file
2. **Selecting** which collections to export via an intuitive UI
3. **Converting** Figma variables to the Design Tokens Community Group specification format
4. **Exporting** tokens in a format compatible with Adobe Spectrum visualizers
5. **Informing** users of the export location and next steps

## Project Status

**Current Phase:** Phase 5 Complete - Validation & Error Handling ✅
**Version:** 0.1.0 (Development)

### Phase 1 Complete ✅

* ✅ Build system (esbuild) configured and working
* ✅ TypeScript configuration with strict mode
* ✅ Testing framework (AVA) set up with passing tests
* ✅ Plugin code entry point (`src/plugin/code.ts`)
* ✅ UI entry point (`src/ui/ui.ts`)
* ✅ Shared TypeScript types and interfaces
* ✅ Package dependencies installed
* ✅ Figma plugin manifest configured

### Phase 2 Complete ✅

* ✅ Type detection algorithm (`src/mapping/typeDetector.ts`)
* ✅ Value transformer (`src/mapping/valueTransformer.ts`)
* ✅ Schema mapper (`src/mapping/schemaMapper.ts`)
* ✅ UUID generator (`src/utils/uuid.ts`)
* ✅ Comprehensive unit tests (10 tests passing)
* ✅ Build verification successful

### Phase 3 Complete ✅

* ✅ Token converter orchestrator (`src/mapping/tokenConverter.ts`)
* ✅ Alias resolution logic
* ✅ Variable map building
* ✅ Complete DTCG token generation
* ✅ Complete Spectrum token generation
* ✅ End-to-end integration tests (20 tests passing)
* ✅ Component name extraction
* ✅ Naming convention support
* ✅ Private variable handling

### Phase 4 Complete ✅

* ✅ File generator for JSON output (`src/export/fileGenerator.ts`)
* ✅ Export coordinator (`src/export/exportCoordinator.ts`)
* ✅ Progress tracking through export stages
* ✅ README and manifest generation
* ✅ Plugin code integration
* ✅ UI download functionality
* ✅ Comprehensive export tests (18 tests passing)
* ✅ Build verification successful (38 total tests passing)

### Phase 5 Complete ✅

* ✅ Comprehensive validators module (`src/utils/validators.ts`)
* ✅ Token value validation (RGB, RGBA, hex colors, dimensions, opacity, font weights, multipliers, aliases)
* ✅ Token structure validation (DTCG and Spectrum formats)
* ✅ Export settings validation
* ✅ Figma variable validation
* ✅ Enhanced error messages throughout pipeline
* ✅ Edge case handling (NaN, Infinity, out-of-range values, clamping)
* ✅ Validation reporting with human-readable output
* ✅ 34 validation tests (72 total tests passing)
* ✅ Build verification successful

### Next Steps

* ⏳ Phase 6: Enhanced UI components and user experience
* ⏳ Phase 7: Manual testing in Figma environment
* ⏳ Phase 8: Plugin publishing and documentation

## Architecture

### Directory Structure

```
tools/figma-plugin/
├── src/
│   ├── plugin/              # Figma plugin backend (sandbox environment)
│   │   ├── code.ts          # Main plugin entry point
│   │   ├── variableScanner.ts    # Scans Figma variable collections
│   │   └── tokenExporter.ts      # Exports tokens to file system
│   │
│   ├── ui/                  # Plugin UI (runs in iframe)
│   │   ├── ui.html          # HTML template
│   │   ├── ui.ts            # UI logic and event handlers
│   │   └── components/      # UI components
│   │       ├── CollectionSelector.ts
│   │       ├── ExportSettings.ts
│   │       └── StatusDisplay.ts
│   │
│   ├── mapping/             # Token type mapping logic
│   │   ├── figmaToSpec.ts   # Maps Figma types to Design Tokens spec
│   │   ├── typeDetector.ts  # Detects token types from Figma variables
│   │   └── schemaMapper.ts  # Maps to Adobe Spectrum schemas
│   │
│   └── utils/               # Shared utilities
│       ├── uuid.ts          # UUID generation
│       ├── validators.ts    # Token validation
│       └── formatters.ts    # Output formatting
│
├── test/                    # Test files
├── docs/                    # Additional documentation
├── examples/                # Example token exports
├── dist/                    # Build output (gitignored)
├── manifest.json            # Figma plugin manifest
├── package.json
├── tsconfig.json
└── README.md
```

### Export Location

**User tokens are exported to:** `/exported-tokens/`

This directory is separate from the core Spectrum tokens (`/packages/tokens/src/`) to ensure:

* Adobe Spectrum tokens are never overwritten
* User-generated tokens are clearly distinguished
* Easy cleanup and version control management

## Token Format Specifications

### Input: Figma Variables

Figma provides variables with the following structure:

* Variable collections (groups of variables)
* Variable types: COLOR, FLOAT, STRING, BOOLEAN
* Variable modes (for variants like light/dark)
* Alias references between variables

### Output: Design Tokens Spec + Adobe Spectrum Extensions

```json
{
  "token-name": {
    "$type": "color",
    "$value": "#FF0000",
    "$description": "Primary brand color",
    "$schema": "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "component": "button"
  }
}
```

**Design Tokens Spec Properties:**

* `$value` (required): The token value
* `$type` (optional): Token type (color, dimension, fontFamily, etc.)
* `$description` (optional): Human-readable description
* `$extensions` (optional): Tool-specific extensions

**Adobe Spectrum Extensions:**

* `$schema`: URL to the token type schema
* `uuid`: Unique identifier for the token
* `component`: Component this token belongs to (optional)
* `private`: Whether token is internal-only (optional)
* `deprecated`: Deprecation status (optional)

## Supported Token Types

Based on Adobe Spectrum's token schemas:

| Figma Type | Design Token Type | Spectrum Schema  |
| ---------- | ----------------- | ---------------- |
| COLOR      | color             | color.json       |
| FLOAT      | dimension         | dimension.json   |
| FLOAT      | opacity           | opacity.json     |
| FLOAT      | multiplier        | multiplier.json  |
| STRING     | fontFamily        | font-family.json |
| STRING     | alias             | alias.json       |

Additional mappings may be inferred from variable naming conventions.

## Development Phases

### Phase 1: Foundation (Week 1)

* [x] Project structure setup
* [x] Configuration files
* [ ] Build system with esbuild
* [ ] TypeScript type definitions for Figma API

### Phase 2: Core Functionality (Week 2)

* [ ] Variable collection scanner
* [ ] Figma API integration
* [ ] Token type detection and mapping
* [ ] Basic export functionality

### Phase 3: User Interface (Week 3)

* [ ] Collection selection UI
* [ ] Export settings panel
* [ ] Progress indicators
* [ ] Status notifications

### Phase 4: Advanced Features (Week 4)

* [ ] Multi-mode support (light/dark themes)
* [ ] Token grouping and organization
* [ ] Validation and error handling
* [ ] Export location customization

### Phase 5: Testing & Documentation (Week 5)

* [ ] Unit tests for mapping logic
* [ ] Integration tests with Figma API
* [ ] User documentation
* [ ] Example exports

## Requirements

### Functional Requirements

#### FR1: Variable Collection Scanning

* Plugin must scan all variable collections in the current Figma file
* Display collection names, mode names, and variable counts
* Support files with multiple collections

#### FR2: Collection Selection

* Users must be able to select which collections to export
* Support multi-select with checkboxes
* Show preview of selected tokens before export

#### FR3: Token Conversion

* Convert Figma COLOR variables to Design Token color type
* Convert Figma FLOAT variables to appropriate types (dimension, opacity, multiplier)
* Convert Figma STRING variables to appropriate types (fontFamily, alias, etc.)
* Preserve variable aliases as token references `{token.name}`
* Generate unique UUIDs for each token

#### FR4: Export Format

* Export tokens as JSON files
* Use Design Tokens Community Group specification format
* Include Adobe Spectrum schema extensions ($schema, uuid, component)
* Organize tokens by collection name

#### FR5: Export Location

* Export tokens to `/exported-tokens/[collection-name].json`
* Display full export path to user
* Ensure path is outside `/packages/tokens/src/` to prevent overwrites

#### FR6: User Feedback

* Show export progress
* Display success/error messages
* Provide export summary (number of tokens, file location)
* Show next steps for using exported tokens

### Non-Functional Requirements

#### NFR1: Performance

* Scan variable collections in <2 seconds for files with <1000 variables
* Export should complete in <5 seconds for typical collections

#### NFR2: Compatibility

* Compatible with Figma Plugin API version 1.0.0
* Works with Adobe Spectrum visualizers (s2-visualizer, s2-tokens-viewer)
* Tokens validate against Adobe Spectrum schemas

#### NFR3: Usability

* Intuitive UI requiring no training
* Clear error messages with actionable guidance
* Keyboard navigation support

#### NFR4: Reliability

* Handle missing or invalid variables gracefully
* Validate token structure before export
* Prevent data loss with confirmation dialogs

## Token Mapping Logic

### Type Detection Strategy

1. **Explicit Type Detection** (from Figma variable type)
   * COLOR → color
   * BOOLEAN → (not yet supported in Design Tokens spec)

2. **Semantic Detection** (from variable name/value)
   * Names containing "opacity", "alpha" → opacity
   * Names containing "size", "width", "height", "spacing" → dimension
   * Names containing "scale", "ratio" → multiplier
   * Names containing "font-family", "typeface" → fontFamily

3. **Value-Based Detection** (from variable value format)
   * String values starting with "{" → alias
   * Numeric values with "px", "rem", "em" → dimension
   * Numeric values 0-1 → opacity (if not dimension)

### Schema Assignment

Based on detected type, assign appropriate Adobe Spectrum schema URL:

```
https://opensource.adobe.com/spectrum-tokens/schemas/token-types/[type].json
```

Available schemas:

* alias.json
* color.json
* color-set.json
* dimension.json
* drop-shadow\.json
* font-family.json
* font-size.json
* font-style.json
* font-weight.json
* gradient-stop.json
* multiplier.json
* opacity.json
* scale-set.json
* set.json
* system-set.json
* text-align.json
* text-transform.json
* typography.json

## Integration with Adobe Spectrum Ecosystem

### Visualizer Compatibility

Exported tokens should work with:

1. **S2 Visualizer** (`docs/s2-visualizer/`)
   * Reads tokens from JSON files
   * Expects Adobe Spectrum format with $schema and uuid
   * Displays tokens grouped by component

2. **S2 Tokens Viewer** (`docs/s2-tokens-viewer/`)
   * Enhanced viewer with component usage analysis
   * Requires proper component attribution
   * Shows token relationships

### Usage Workflow

1. Designer creates variables in Figma
2. Export tokens using this plugin to `/exported-tokens/`
3. Review exported tokens in visualizer
4. (Future) Transform tokens using existing Adobe tools
5. (Future) Integrate into design system build process

## Development Guidelines

### For Frontend Developer Agent

**Tasks:**

1. Implement build system using esbuild
2. Create Figma plugin backend (`src/plugin/`)
   * Variable collection scanning
   * File system writing via Figma API
   * Communication with UI
3. Create plugin UI (`src/ui/`)
   * Collection selection interface
   * Export settings panel
   * Status and progress display
4. Write tests for core functionality

**Technical Constraints:**

* Must use Figma Plugin API types
* Plugin code runs in sandbox (no DOM access)
* UI code runs in iframe (no Figma API access)
* Communication via `postMessage` pattern

**Resources:**

* Figma Plugin API: <https://www.figma.com/plugin-docs/>
* esbuild bundler: <https://esbuild.github.io/>

### For Design System Expert Agent

**Tasks:**

1. Implement token mapping logic (`src/mapping/`)
   * Figma type to Design Token type conversion
   * Semantic type detection from names
   * Schema URL assignment
2. Create UUID generation utility
3. Implement token validation
4. Create example token exports for testing

**Technical Constraints:**

* Must comply with Design Tokens Community Group spec
* Must generate valid Adobe Spectrum token format
* Must assign correct schema URLs
* UUIDs must be v4 format

**Resources:**

* Design Tokens spec: <https://design-tokens.github.io/community-group/format/>
* Adobe Spectrum schemas: `/docs/site/public/schemas/token-types/`

## Testing Strategy

### Unit Tests

* Token type detection logic
* Figma to spec format conversion
* UUID generation
* Value formatting

### Integration Tests

* End-to-end export workflow
* Multi-collection handling
* Alias resolution
* Schema validation

### Manual Testing

* Test with real Figma files
* Verify exported tokens in visualizers
* Test with various variable types and modes
* Edge cases (empty collections, circular aliases)

## Future Enhancements

* Support for variable modes (light/dark themes) → token sets
* Bulk export of all collections
* Export format options (JSON, YAML, TypeScript)
* Integration with Adobe's token transformation tools
* Direct upload to Spectrum design system
* Token diff comparison with existing Spectrum tokens
* Support for composite token types (typography, drop-shadow)

## Contributing

This plugin is part of the Adobe Spectrum Tokens monorepo. Follow the repository's contribution guidelines:

1. Create feature branch
2. Implement changes with tests
3. Format code with Prettier
4. Create changeset with `pnpm changeset`
5. Submit pull request

## License

Apache-2.0 - See LICENSE file for details

## Questions & Support

* Issues: <https://github.com/adobe/spectrum-tokens/issues>
* Discussions: <https://github.com/adobe/spectrum-tokens/discussions>
