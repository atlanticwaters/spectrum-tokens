# Spectrum Figma Token Exporter - Detailed Requirements

## Table of Contents

1. [Project Goals](#project-goals)
2. [User Stories](#user-stories)
3. [Functional Requirements](#functional-requirements)
4. [Technical Requirements](#technical-requirements)
5. [UI/UX Requirements](#ui-requirements)
6. [Token Mapping Requirements](#token-mapping-requirements)
7. [Validation Requirements](#validation-requirements)
8. [Error Handling](#error-handling)
9. [Success Criteria](#success-criteria)

## Project Goals

### Primary Goals

1. Enable designers to export Figma variables as Adobe Spectrum-compatible design tokens
2. Maintain compatibility with existing Spectrum visualizers and tooling
3. Preserve token relationships (aliases/references)
4. Provide clear, actionable feedback to users

### Secondary Goals

1. Support multiple variable collections in a single export
2. Handle complex token types (colors, dimensions, typography)
3. Generate valid UUIDs for token tracking
4. Provide extensible architecture for future enhancements

### Non-Goals (Out of Scope)

* Direct integration with Spectrum build system (future enhancement)
* Bi-directional sync between Figma and Spectrum (future enhancement)
* Token versioning and change tracking (use existing diff tools)
* Multi-file batch processing (future enhancement)

## User Stories

### US1: Designer Exports Variables

**As a** product designer
**I want to** export my Figma variables to design tokens
**So that** developers can use consistent values in code

**Acceptance Criteria:**

* Can launch plugin from Figma file
* Can see all available variable collections
* Can export selected collections
* Receive confirmation with file location

### US2: Designer Previews Tokens Before Export

**As a** product designer
**I want to** preview how my variables will be converted
**So that** I can verify the export is correct before saving

**Acceptance Criteria:**

* Can see preview of token structure
* Can see how Figma types map to token types
* Can see which aliases will be preserved

### US3: Designer Works with Multiple Collections

**As a** product designer
**I want to** export multiple variable collections at once
**So that** I can manage related token sets efficiently

**Acceptance Criteria:**

* Can select multiple collections
* Each collection exports to separate file
* File names match collection names

### US4: Designer Troubleshoots Export Issues

**As a** product designer
**I want to** clear error messages when something goes wrong
**So that** I can fix issues and successfully export

**Acceptance Criteria:**

* Validation errors show specific problems
* Error messages suggest solutions
* Can retry export after fixing issues

### US5: Developer Integrates Tokens

**As a** front-end developer
**I want to** receive tokens in a standard format
**So that** I can integrate them into the build system

**Acceptance Criteria:**

* Tokens follow Design Tokens spec
* Include necessary Adobe Spectrum metadata
* Validate against Spectrum schemas
* Work with existing Spectrum visualizers

## Functional Requirements

### FR1: Variable Collection Discovery

**FR1.1 - Scan Collections**

* Plugin SHALL scan all variable collections in the current Figma file
* Plugin SHALL retrieve collection metadata (name, id, mode count)
* Plugin SHALL count variables in each collection
* Plugin SHALL detect variable modes (e.g., light/dark)

**FR1.2 - Display Collections**

* Plugin SHALL display collection names in UI
* Plugin SHALL show variable count per collection
* Plugin SHALL show mode names if multiple modes exist
* Plugin SHALL indicate if collection has no variables

### FR2: Collection Selection

**FR2.1 - Selection Interface**

* Users SHALL be able to select one or more collections
* UI SHALL provide checkboxes for multi-select
* UI SHALL provide "Select All" / "Deselect All" options
* UI SHALL show selection count (e.g., "3 of 5 selected")

**FR2.2 - Selection Validation**

* Plugin SHALL require at least one collection to be selected
* Plugin SHALL disable export button if no selection
* Plugin SHALL persist selection during session

### FR3: Token Conversion

**FR3.1 - Type Mapping**

* Plugin SHALL convert Figma COLOR to Design Token "color" type
* Plugin SHALL convert Figma FLOAT to appropriate token type:
  * dimension (if name contains size/width/height/spacing keywords)
  * opacity (if value 0-1 and name contains opacity/alpha keywords)
  * multiplier (if name contains scale/ratio keywords)
  * dimension (default fallback)
* Plugin SHALL convert Figma STRING to appropriate type:
  * alias (if value starts with "{" and ends with "}")
  * fontFamily (if name contains font/typeface keywords)
  * string (default)
* Plugin SHALL convert Figma BOOLEAN to boolean (noted as non-standard)

**FR3.2 - Value Conversion**

* Plugin SHALL preserve color values in hex format (#RRGGBB or #RRGGBBAA)
* Plugin SHALL preserve numeric values as-is
* Plugin SHALL convert alias references to `{reference.name}` format
* Plugin SHALL handle nested alias chains

**FR3.3 - Metadata Generation**

* Plugin SHALL generate unique UUID v4 for each token
* Plugin SHALL assign appropriate $schema URL based on type
* Plugin SHALL preserve variable description as $description
* Plugin SHALL use collection name as component attribute (optional)

### FR4: Export Functionality

**FR4.1 - File Generation**

* Plugin SHALL export tokens as JSON files
* Plugin SHALL use collection name as filename (sanitized)
* Plugin SHALL format JSON with 2-space indentation
* Plugin SHALL export to `/exported-tokens/` directory

**FR4.2 - File Organization**

* Plugin SHALL create separate file per collection
* Plugin SHALL organize tokens alphabetically by key
* Plugin SHALL use flat structure (no nesting) for compatibility

**FR4.3 - Export Execution**

* Plugin SHALL show progress indicator during export
* Plugin SHALL complete export in <5 seconds for typical collections
* Plugin SHALL handle concurrent exports safely

### FR5: User Feedback

**FR5.1 - Progress Indication**

* Plugin SHALL show loading state during scan
* Plugin SHALL show progress during export
* Plugin SHALL show completion status

**FR5.2 - Success Messaging**

* Plugin SHALL display success message on completion
* Plugin SHALL show number of tokens exported
* Plugin SHALL show full file path for each export
* Plugin SHALL provide "Copy Path" functionality

**FR5.3 - Error Messaging**

* Plugin SHALL display clear error messages
* Plugin SHALL suggest corrective actions
* Plugin SHALL log errors for debugging

### FR6: Safety Features

**FR6.1 - Overwrite Protection**

* Plugin SHALL confirm before overwriting existing files
* Plugin SHALL show file modification date if exists
* Plugin SHALL provide "Skip" or "Overwrite" options

**FR6.2 - Validation**

* Plugin SHALL validate token structure before export
* Plugin SHALL check for required fields ($value, uuid)
* Plugin SHALL warn about invalid schema URLs
* Plugin SHALL prevent export if critical validation fails

## Technical Requirements

### TR1: Figma Plugin Architecture

**TR1.1 - Plugin Structure**

* Plugin SHALL use Figma Plugin API v1.0.0
* Plugin SHALL separate backend (sandbox) from UI (iframe)
* Plugin SHALL use TypeScript for type safety
* Plugin SHALL bundle with esbuild

**TR1.2 - Communication**

* Plugin SHALL use postMessage for UI ↔ backend communication
* Plugin SHALL define typed message interfaces
* Plugin SHALL handle async operations properly

### TR2: Build System

**TR2.1 - Build Configuration**

* Project SHALL use esbuild for bundling
* Project SHALL compile TypeScript to ES2020
* Project SHALL output to `dist/` directory
* Project SHALL generate two bundles: `code.js` (backend) and `ui.html` (UI)

**TR2.2 - Development Workflow**

* Project SHALL provide `pnpm build` command
* Project SHALL provide `pnpm watch` command for development
* Project SHALL use source maps in development

### TR3: Dependencies

**TR3.1 - Runtime Dependencies**

* uuid: For generating token UUIDs
* Minimal dependencies to reduce bundle size

**TR3.2 - Development Dependencies**

* TypeScript: Type checking and compilation
* esbuild: Fast bundling
* ava: Testing framework
* Prettier: Code formatting

### TR4: Code Quality

**TR4.1 - Type Safety**

* All code SHALL be TypeScript with strict mode enabled
* No implicit `any` types allowed
* Proper typing for Figma API interactions

**TR4.2 - Testing**

* Core mapping logic SHALL have unit tests
* Test coverage SHALL be >80% for mapping modules
* Tests SHALL use AVA framework

**TR4.3 - Formatting**

* Code SHALL be formatted with Prettier
* Formatting SHALL match monorepo standards
* Pre-commit hooks SHALL enforce formatting

## UI Requirements

### UR1: Visual Design

**UR1.1 - Consistency**

* UI SHALL use Figma plugin UI kit styles
* UI SHALL follow Spectrum design principles
* UI SHALL maintain 8px grid system

**UR1.2 - Layout**

* UI SHALL have header with plugin name
* UI SHALL have main content area for collection list
* UI SHALL have footer with action buttons
* UI SHALL be minimum 300px wide × 400px tall

### UR2: Collection List

**UR2.1 - List Items**

* Each collection SHALL display:
  * Checkbox for selection
  * Collection name
  * Variable count
  * Mode names (if multiple modes)
* List SHALL support keyboard navigation
* List SHALL show empty state if no collections

**UR2.2 - Interactions**

* Hovering collection SHALL highlight row
* Clicking anywhere on row SHALL toggle selection
* Checkboxes SHALL have clear visual states (unchecked, checked, indeterminate)

### UR3: Action Buttons

**UR3.1 - Export Button**

* Button SHALL be prominently placed in footer
* Button SHALL be disabled if no selection
* Button SHALL show loading state during export
* Button text SHALL be "Export Tokens"

**UR3.2 - Cancel/Close Button**

* Button SHALL close plugin window
* Button SHALL confirm if export in progress
* Button text SHALL be "Cancel" or "Close"

### UR4: Feedback Elements

**UR4.1 - Status Messages**

* Success messages SHALL use green color
* Error messages SHALL use red color
* Warning messages SHALL use orange color
* Messages SHALL be dismissible

**UR4.2 - Progress Indicators**

* Scanning SHALL show spinner with "Scanning variables..."
* Exporting SHALL show progress bar or spinner
* Completion SHALL show checkmark icon

### UR5: Accessibility

**UR5.1 - Keyboard Support**

* All interactive elements SHALL be keyboard accessible
* Tab order SHALL be logical
* Enter/Space SHALL activate buttons
* Esc SHALL close plugin

**UR5.2 - Screen Readers**

* Form elements SHALL have labels
* Status messages SHALL be announced
* Loading states SHALL be announced

## Token Mapping Requirements

### TM1: Type Detection

**TM1.1 - Color Tokens**

* Figma COLOR variables SHALL map to "color" type
* Color values SHALL be in hex format (#RRGGBB or #RRGGBBAA)
* Schema SHALL be `color.json`

**TM1.2 - Dimension Tokens**

* Figma FLOAT with dimension keywords SHALL map to "dimension" type
* Keywords: size, width, height, spacing, padding, margin, gap, radius, border
* Values SHALL preserve numeric value (assume px units)
* Schema SHALL be `dimension.json`

**TM1.3 - Opacity Tokens**

* Figma FLOAT with opacity keywords SHALL map to "opacity" type
* Keywords: opacity, alpha, transparency
* Values SHALL be 0-1 decimal
* Schema SHALL be `opacity.json`

**TM1.4 - Multiplier Tokens**

* Figma FLOAT with scale keywords SHALL map to "multiplier" type
* Keywords: scale, ratio, multiplier, factor
* Values SHALL be numeric (typically 0.5-3.0)
* Schema SHALL be `multiplier.json`

**TM1.5 - Font Family Tokens**

* Figma STRING with font keywords SHALL map to "fontFamily" type
* Keywords: font-family, typeface, font
* Values SHALL be font family names
* Schema SHALL be `font-family.json`

**TM1.6 - Alias Tokens**

* Figma variables referencing other variables SHALL map to "alias" type
* Values SHALL use `{reference.name}` format
* Schema SHALL be `alias.json`
* SHALL preserve alias chain (alias to alias)

### TM2: Naming Conventions

**TM2.1 - Token Names**

* Token names SHALL use Figma variable name
* Spaces SHALL be converted to hyphens
* Names SHALL be lowercase
* Special characters SHALL be sanitized

**TM2.2 - Grouping**

* Collection name SHALL be used for component attribute
* Mode names SHALL be preserved for future set support

### TM3: Value Formatting

**TM3.1 - Color Values**

* RGB colors SHALL use #RRGGBB format
* RGBA colors SHALL use #RRGGBBAA format
* Alpha SHALL be two hex digits (00-FF)

**TM3.2 - Numeric Values**

* Numbers SHALL preserve original precision
* Trailing zeros SHALL be removed
* Scientific notation SHALL be avoided

**TM3.3 - String Values**

* Strings SHALL be double-quoted in JSON
* Special characters SHALL be escaped
* Quotes within strings SHALL be escaped

## Validation Requirements

### VR1: Pre-Export Validation

**VR1.1 - Token Structure**

* Each token MUST have `$value` property
* Each token MUST have `uuid` property
* Each token SHOULD have `$schema` property
* Each token MAY have `$type`, `$description`, `component`

**VR1.2 - Value Validation**

* Color values MUST match hex format regex: `^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$`
* Opacity values MUST be 0-1 decimal
* UUID values MUST be valid v4 UUIDs
* Alias references MUST match format: `^{[a-zA-Z0-9-_/]+}$`

**VR1.3 - Schema Validation**

* Schema URLs MUST start with `https://opensource.adobe.com/spectrum-tokens/schemas/`
* Schema URLs MUST reference existing schema files
* Schema MUST match token type

### VR2: Post-Export Validation

**VR2.1 - File Validation**

* Output MUST be valid JSON
* JSON MUST parse without errors
* File size SHOULD be reasonable (<10MB)

**VR2.2 - Schema Conformance**

* Tokens SHOULD validate against referenced schemas
* Plugin MAY warn about schema validation failures
* Plugin SHALL NOT block export on schema warnings

## Error Handling

### EH1: User Errors

**EH1.1 - No Collections Found**

* Message: "No variable collections found in this file. Create variables to get started."
* Action: Show "Learn More" link to Figma variables documentation

**EH1.2 - No Selection**

* Message: "Please select at least one collection to export."
* Action: Disable export button, highlight selection area

**EH1.3 - Empty Collection**

* Message: "Collection '\[name]' contains no variables and will be skipped."
* Action: Show warning, allow export of non-empty collections

### EH2: System Errors

**EH2.1 - File Write Error**

* Message: "Failed to save tokens to disk. Please check permissions and try again."
* Action: Show error details, allow retry

**EH2.2 - Invalid Variable Type**

* Message: "Variable '\[name]' has unsupported type and will be skipped."
* Action: Log warning, continue export

**EH2.3 - Circular Alias Reference**

* Message: "Circular reference detected in alias chain: \[chain]. These tokens will be skipped."
* Action: Log warning, skip affected tokens, continue export

### EH3: Validation Errors

**EH3.1 - Invalid Color Format**

* Message: "Variable '\[name]' has invalid color value '\[value]'. Expected hex format."
* Action: Show warning, attempt to convert, or skip token

**EH3.2 - Invalid Alias Reference**

* Message: "Variable '\[name]' references non-existent variable '\[ref]'."
* Action: Show warning, export as literal value or skip

**EH3.3 - UUID Generation Failure**

* Message: "Failed to generate UUID for token '\[name]'. Please retry export."
* Action: Show error, block export

## Success Criteria

### Minimum Viable Product (MVP)

* [x] Plugin loads in Figma without errors
* [ ] Plugin scans and displays variable collections
* [ ] User can select one or more collections
* [ ] Plugin exports tokens to `/exported-tokens/` directory
* [ ] Exported tokens follow Design Tokens spec format
* [ ] Exported tokens include Adobe Spectrum metadata (schema, uuid)
* [ ] Color and dimension tokens export correctly
* [ ] Alias references are preserved
* [ ] User receives success message with file location
* [ ] Basic error handling for common issues

### Version 1.0 Release Criteria

* [ ] All functional requirements implemented
* [ ] All token types mapped correctly
* [ ] Comprehensive error handling
* [ ] Unit tests with >80% coverage
* [ ] Integration tests with sample Figma files
* [ ] User documentation complete
* [ ] Tested with Adobe Spectrum visualizers
* [ ] No critical bugs

### Quality Metrics

* **Performance:** Export <1000 tokens in <5 seconds
* **Reliability:** Success rate >95% for valid inputs
* **Usability:** User can complete export in <30 seconds
* **Compatibility:** Exported tokens validate with Spectrum schemas
* **Code Quality:** TypeScript strict mode, no ESLint errors

### Testing Checklist

* [ ] Export single collection with colors
* [ ] Export single collection with dimensions
* [ ] Export single collection with mixed types
* [ ] Export multiple collections simultaneously
* [ ] Export collection with alias references
* [ ] Export collection with multiple modes
* [ ] Handle empty collection gracefully
* [ ] Handle file with no collections gracefully
* [ ] Handle existing file overwrite scenario
* [ ] Verify tokens in S2 visualizer
* [ ] Verify tokens in S2 tokens viewer
* [ ] Test with large collection (>500 tokens)
* [ ] Test with deeply nested aliases (>3 levels)

## Glossary

* **Design Token:** A named entity that stores visual design attributes (colors, spacing, typography, etc.)
* **Figma Variable:** Figma's native feature for reusable design values
* **Variable Collection:** A group of related Figma variables
* **Variable Mode:** A variant of a collection (e.g., light mode, dark mode)
* **Alias:** A token that references another token instead of having a literal value
* **Schema:** A JSON schema that defines the structure and validation rules for a token type
* **UUID:** Universally Unique Identifier, used to track tokens across versions
* **Design Tokens Community Group:** W3C community group defining the Design Tokens specification
