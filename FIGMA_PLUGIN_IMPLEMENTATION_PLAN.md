# Figma to Spectrum Tokens Exporter - Implementation Plan

**Project:** Adobe Spectrum Design Tokens
**Component:** Figma Plugin for Token Export
**Version:** 1.0.0
**Date:** November 18, 2025

***

## Executive Summary

This document outlines the implementation plan for developing a Figma plugin that exports Figma Variables to W3C Design Tokens format (DTCG 2025.10), ensuring compatibility with Adobe Spectrum's design system and existing visualizers.

### Documentation Index

1. **FIGMA\_PLUGIN\_TECHNICAL\_SPEC.md** - Complete technical specification with architecture, interfaces, and detailed component design
2. **FIGMA\_PLUGIN\_EXAMPLE\_CODE.md** - Code examples and skeletons demonstrating the architecture
3. **FIGMA\_PLUGIN\_ARCHITECTURE.md** - Visual diagrams of architecture, data flow, and component interactions
4. **FIGMA\_PLUGIN\_IMPLEMENTATION\_PLAN.md** - This document: Implementation roadmap and coordination plan

***

## Project Goals

### Primary Goals

1. Enable designers to export Figma Variables to standardized Design Tokens format
2. Ensure 100% compatibility with Adobe Spectrum token structure
3. Support multi-mode variables (light/dark themes)
4. Preserve Figma metadata for future bidirectional sync
5. Provide excellent user experience with clear progress feedback

### Success Metrics

* Export accuracy: 100% (all tokens correctly converted)
* Performance: Export 1000 tokens in < 5 seconds
* User satisfaction: Clear UI, minimal errors
* Compatibility: Works with all Spectrum visualizers

***

## Architecture Overview

### Technology Stack

* **Language:** TypeScript (ES2020)
* **UI Framework:** React 18
* **Build Tool:** Vite 5
* **Test Framework:** AVA 6
* **Package Manager:** pnpm 10
* **Task Runner:** Moon
* **Type Checking:** TypeScript 5.4

### Plugin Structure

```
UI Layer (iframe)           Code Layer (sandbox)
    ↓                              ↓
React Components    ←─────→  Figma API Integration
    ↓                              ↓
postMessage             Token Conversion Engine
                                   ↓
                           File Generation & Export
```

### Core Components

1. **UI Layer** - User interaction and display
2. **API Layer** - Figma Variables API access
3. **Conversion Layer** - Figma → DTCG transformation
4. **Export Layer** - File generation and validation
5. **Shared Layer** - Types and constants

***

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up project structure and core infrastructure

#### Tasks

1. **Project Setup**
   * [ ] Create plugin directory: `tools/figma-spectrum-tokens-exporter/`
   * [ ] Initialize package.json with dependencies
   * [ ] Configure TypeScript (tsconfig.json)
   * [ ] Set up Vite build configurations (UI + Plugin)
   * [ ] Configure Moon tasks (moon.yml)
   * [ ] Set up AVA for testing (ava.config.js)
   * [ ] Create manifest.json

2. **Type Definitions**
   * [ ] Define Figma types (`src/shared/types/figma-types.ts`)
   * [ ] Define token types (`src/shared/types/token-types.ts`)
   * [ ] Define message types (`src/shared/types/plugin-messages.ts`)
   * [ ] Define config types (`src/shared/types/config-types.ts`)
   * [ ] Define error types (`src/shared/types/error-types.ts`)

3. **Basic Infrastructure**
   * [ ] Create plugin entry point (`src/plugin/code.ts`)
   * [ ] Create UI entry point (`src/ui/ui.tsx`)
   * [ ] Set up message passing skeleton
   * [ ] Create error handler utility
   * [ ] Create logger utility

**Deliverable:** Buildable plugin skeleton with type definitions

***

### Phase 2: Figma API Integration (Week 3)

**Goal:** Implement Figma Variables API access

#### Tasks

1. **API Wrapper**
   * [ ] Implement `FigmaVariablesAPI.ts`
     * `getLocalCollections()`
     * `getVariablesInCollection()`
     * `getVariableById()`
     * `isAlias()`

2. **Collection Reader**
   * [ ] Implement `CollectionReader.ts`
     * `getCollectionSummaries()` (for UI)
     * `getCollectionData()` (for export)

3. **Variable Resolver**
   * [ ] Implement `VariableResolver.ts`
     * `buildCache()`
     * `getVariable()`
     * `getVariableReferencePath()`
     * `isAlias()`

4. **Testing**
   * [ ] Write unit tests for API wrapper
   * [ ] Create test fixtures with sample Figma data
   * [ ] Test alias resolution

**Deliverable:** Fully functional Figma API integration layer

***

### Phase 3: UI Development (Week 4)

**Goal:** Build user interface components

#### Tasks

1. **Main App Component**
   * [ ] Implement `App.tsx`
     * State management
     * Message handling
     * View orchestration

2. **UI Components**
   * [ ] `CollectionSelector.tsx` - Collection selection UI
   * [ ] `SettingsPanel.tsx` - Export configuration
   * [ ] `ProgressIndicator.tsx` - Export progress display
   * [ ] `ExportResults.tsx` - Success state with results
   * [ ] `ErrorDisplay.tsx` - Error display with recovery

3. **Styling**
   * [ ] Create `main.css` with Spectrum-inspired design
   * [ ] Ensure responsive layout
   * [ ] Add loading states and transitions

4. **Testing**
   * [ ] Manual testing in Figma
   * [ ] Test all UI states (loading, selecting, exporting, success, error)
   * [ ] Test message communication

**Deliverable:** Fully functional UI with all states

***

### Phase 4: Token Conversion (Week 5)

**Goal:** Implement core conversion logic

#### Tasks

1. **Type Mapper**
   * [ ] Implement `TypeMapper.ts`
     * `mapType()` - Figma type → DTCG type
     * `inferSpecificType()` - Smart type inference

2. **Value Transformer**
   * [ ] Implement `ValueTransformer.ts`
     * `transformValue()` - Main transformation
     * `transformNumber()` - Number → dimension/duration
     * `transformColor()` - RGB/RGBA → hex/rgba()

3. **Token Converter**
   * [ ] Implement `TokenConverter.ts`
     * `convertCollection()` - Main orchestrator
     * `convertVariable()` - Single variable conversion
     * `getTokenValue()` - Value extraction with alias handling
     * `mergeIntoGroup()` - Hierarchical grouping

4. **Mode Handler**
   * [ ] Implement `ModeHandler.ts`
     * `getModeStrategy()` - Determine handling approach
     * `createTokenSets()` - Generate Spectrum-style sets

5. **Testing**
   * [ ] Unit tests for TypeMapper
   * [ ] Unit tests for ValueTransformer
   * [ ] Integration tests for TokenConverter
   * [ ] Test with complex variable structures
   * [ ] Test alias resolution
   * [ ] Test mode handling

**Deliverable:** Working conversion engine with full test coverage

***

### Phase 5: Export & Validation (Week 6)

**Goal:** Implement file generation and validation

#### Tasks

1. **File Generator**
   * [ ] Implement `FileGenerator.ts`
     * `generateFiles()` - Main generation method
     * `generateSingleFile()` - Combined export
     * `generateMultipleFiles()` - Per-collection export
     * `getFileName()` - File naming logic
     * `countTokens()` - Token counting

2. **Validator**
   * [ ] Implement `Validator.ts`
     * `validate()` - Main validation
     * `validateTokenFile()` - File-level validation
     * `validateGroup()` - Group validation
     * `validateToken()` - Token validation
     * `validateTokenValue()` - Type-specific validation

3. **Formatter**
   * [ ] Implement `Formatter.ts`
     * `format()` - JSON formatting
     * `formatCustom()` - Custom indentation
     * `formatCompact()` - Minified output

4. **Testing**
   * [ ] Unit tests for file generation
   * [ ] Unit tests for validation
   * [ ] Test with invalid data
   * [ ] Validate output against DTCG spec
   * [ ] Test with Spectrum visualizers

**Deliverable:** Export system with validation

***

### Phase 6: Integration & Testing (Week 7)

**Goal:** End-to-end integration and comprehensive testing

#### Tasks

1. **Integration**
   * [ ] Connect all components in `code.ts`
   * [ ] Implement `handleFetchCollections()`
   * [ ] Implement `handleExportTokens()`
   * [ ] Wire up error handling
   * [ ] Implement progress reporting

2. **Testing**
   * [ ] Integration tests for full export flow
   * [ ] Test with real Figma files
   * [ ] Test edge cases (empty collections, invalid data)
   * [ ] Performance testing (1000+ tokens)
   * [ ] Test exported files in visualizers

3. **Error Handling**
   * [ ] Implement comprehensive error messages
   * [ ] Add recovery suggestions
   * [ ] Test all error scenarios
   * [ ] Ensure graceful degradation

**Deliverable:** Fully integrated and tested plugin

***

### Phase 7: Polish & Documentation (Week 8)

**Goal:** Finalize UX and create documentation

#### Tasks

1. **UX Polish**
   * [ ] Refine UI transitions and animations
   * [ ] Improve loading states
   * [ ] Add helpful tooltips
   * [ ] Optimize performance
   * [ ] Add keyboard shortcuts

2. **Documentation**
   * [ ] Write README.md
   * [ ] Document installation process
   * [ ] Create user guide
   * [ ] Document API for future extensions
   * [ ] Add code comments

3. **Packaging**
   * [ ] Create release build
   * [ ] Test installation from scratch
   * [ ] Prepare for distribution

**Deliverable:** Production-ready plugin with documentation

***

## Development Workflow

### Daily Development Cycle

```bash
# 1. Start development mode
pnpm dev

# 2. In Figma: Plugins → Development → Import plugin from manifest
# 3. Make code changes
# 4. Rebuild automatically (dev mode watches)
# 5. In Figma: Run plugin again to see changes
# 6. Debug using Figma Console + Browser DevTools
```

### Testing Workflow

```bash
# Run all tests
pnpm moon run :test

# Run specific test file
pnpm ava test/unit/TypeMapper.test.ts

# Run tests in watch mode
pnpm ava --watch

# Type checking
pnpm type-check
```

### Build Workflow

```bash
# Development build (with sourcemaps)
pnpm build

# Production build (optimized)
pnpm moon run :build
```

***

## Integration Points

### 1. Spectrum Tokens Package

* **Location:** `/packages/tokens/`
* **Integration:** Ensure exported tokens match existing token structure
* **Validation:** Use existing token schemas for validation

### 2. Spectrum Visualizers

* **Visualizers:**
  * `/docs/visualizer/` (S1 tokens)
  * `/docs/s2-visualizer/` (S2 tokens)
  * `/docs/s2-tokens-viewer/` (S2 with analysis)
* **Integration:** Test exported tokens load correctly in all visualizers
* **Format:** Match expected JSON structure (see examples in `/docs/*/public/json/`)

### 3. Component Schemas

* **Location:** `/packages/component-schemas/`
* **Integration:** Consider component-specific token exports (future)
* **Validation:** Validate component tokens against schemas

***

## Quality Assurance

### Code Quality Standards

* [ ] 80%+ test coverage
* [ ] All TypeScript strict checks enabled
* [ ] No linting errors (Prettier)
* [ ] All types explicitly defined
* [ ] Comprehensive error handling

### Testing Checklist

* [ ] Unit tests for all conversion logic
* [ ] Integration tests for full export flow
* [ ] Manual testing in Figma with real files
* [ ] Edge case testing (empty, invalid, large files)
* [ ] Performance testing (1000+ tokens)
* [ ] Cross-platform testing (Mac/Windows)

### Documentation Checklist

* [ ] README with installation instructions
* [ ] User guide with screenshots
* [ ] API documentation for developers
* [ ] Code comments for complex logic
* [ ] Example files and fixtures

***

## Risk Management

### Technical Risks

1. **Figma API Changes**
   * **Risk:** Figma API might change
   * **Mitigation:** Use stable async methods, version-lock [**@figma/plugin-typings**](https://github.com/figma/plugin-typings)

2. **Complex Alias Resolution**
   * **Risk:** Circular references, deep nesting
   * **Mitigation:** Implement cycle detection, limit recursion depth

3. **Performance Issues**
   * **Risk:** Large files with 1000+ variables
   * **Mitigation:** Async operations, progress reporting, batch processing

4. **DTCG Spec Compatibility**
   * **Risk:** Spec might evolve
   * **Mitigation:** Version exported tokens, maintain spec version in output

### User Experience Risks

1. **Unclear Error Messages**
   * **Risk:** Users don't understand errors
   * **Mitigation:** User-friendly messages with recovery suggestions

2. **Complex Configuration**
   * **Risk:** Too many options confuse users
   * **Mitigation:** Smart defaults, progressive disclosure

3. **Lost Work**
   * **Risk:** Export fails after long process
   * **Mitigation:** Validation before export, autosave configs

***

## Coordination with Other Agents

### Project Manager Coordination

* **Needs:**
  * Timeline approval
  * Resource allocation
  * Go/no-go decision points
* **Provides:**
  * Progress updates
  * Blocker escalation
  * Phase completion reports

### Design System Expert Coordination

* **Needs:**
  * Spectrum token structure validation
  * Schema compatibility verification
  * Component token mapping guidance
* **Provides:**
  * Exported token samples for review
  * Questions about Spectrum token patterns
  * Integration testing results

### Stakeholder Communication

* **Weekly Updates:**
  * Phase completion status
  * Demo of working features
  * Upcoming milestones
* **Deliverable Reviews:**
  * Phase 1: Project structure review
  * Phase 4: Conversion logic review
  * Phase 6: Full plugin demo
  * Phase 7: Final review

***

## Next Steps

### Immediate Actions (Week 1)

1. **Get Approval**
   * Review technical spec with team
   * Confirm architecture decisions
   * Get go-ahead to proceed

2. **Set Up Development Environment**
   * Create plugin directory structure
   * Initialize package.json
   * Configure build tools

3. **Start Phase 1 Implementation**
   * Begin type definitions
   * Create project skeleton
   * Set up basic message passing

### Decision Points

**After Phase 1 (Week 2)**

* Review: Project structure and type definitions
* Decision: Proceed to Figma API integration?

**After Phase 4 (Week 5)**

* Review: Conversion logic and output format
* Decision: Format matches Spectrum requirements?

**After Phase 6 (Week 7)**

* Review: Full integration and testing results
* Decision: Ready for polish and release?

***

## Success Criteria

The plugin is considered successful when:

1. **Functionality**
   * [ ] Exports all Figma variable types correctly
   * [ ] Preserves aliases and references
   * [ ] Handles multi-mode variables
   * [ ] Generates valid DTCG 2025.10 format
   * [ ] Works with all Spectrum visualizers

2. **Performance**
   * [ ] Exports 1000 tokens in < 5 seconds
   * [ ] UI remains responsive during export
   * [ ] No memory leaks

3. **User Experience**
   * [ ] Clear, intuitive UI
   * [ ] Helpful error messages
   * [ ] Progress feedback
   * [ ] Successful first-time use without documentation

4. **Quality**
   * [ ] 80%+ test coverage
   * [ ] No critical bugs
   * [ ] All edge cases handled
   * [ ] Comprehensive documentation

5. **Integration**
   * [ ] Tokens load in visualizer
   * [ ] Tokens load in s2-visualizer
   * [ ] Tokens load in s2-tokens-viewer
   * [ ] Tokens match Spectrum structure

***

## Resources

### Documentation

* [W3C Design Tokens Format Spec](https://www.designtokens.org/tr/drafts/format/)
* [Figma Plugin API](https://www.figma.com/plugin-docs/)
* [Figma Variables API](https://www.figma.com/plugin-docs/working-with-variables/)
* [Spectrum Tokens GitHub](https://github.com/adobe/spectrum-tokens)

### Example Tokens

* `/docs/visualizer/public/json/` - S1 token examples
* `/docs/s2-visualizer/public/json/` - S2 token examples
* `/docs/s2-tokens-viewer/tokens/src/` - S2 source tokens

### Tools

* [Vite](https://vitejs.dev/) - Build tool
* [AVA](https://github.com/avajs/ava) - Test framework
* [Moon](https://moonrepo.dev/) - Task runner
* [pnpm](https://pnpm.io/) - Package manager

***

## Appendix: File Checklist

### Required Files

* [ ] `manifest.json` - Figma plugin manifest
* [ ] `package.json` - Dependencies and scripts
* [ ] `tsconfig.json` - TypeScript configuration
* [ ] `moon.yml` - Moon task definitions
* [ ] `ava.config.js` - Test configuration
* [ ] `vite.ui.config.ts` - UI build config
* [ ] `vite.plugin.config.ts` - Plugin build config
* [ ] `README.md` - Documentation

### Source Files

* [ ] `src/ui/index.html` - UI entry HTML
* [ ] `src/ui/ui.tsx` - UI entry TypeScript
* [ ] `src/plugin/code.ts` - Plugin entry TypeScript
* [ ] All component files (see technical spec)
* [ ] All type definition files
* [ ] All test files

### Output Files

* [ ] `dist/code.js` - Compiled plugin code
* [ ] `dist/ui.html` - Bundled UI
* [ ] `dist/ui.js` - Bundled UI JavaScript (inline in HTML)

***

**Document Status:** Ready for Implementation
**Next Review:** After Phase 1 Completion
**Owner:** Frontend Developer Agent
**Approvers:** Project Manager, Design System Expert

***
