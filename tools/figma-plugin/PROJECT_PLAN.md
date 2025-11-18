# Spectrum Figma Token Exporter - Project Plan

## Executive Summary

**Project:** Figma Plugin for exporting design tokens compatible with Adobe Spectrum
**Status:** Planning Complete - Ready for Implementation
**Timeline:** 5 weeks (estimated)
**Team:** Frontend Developer Agent + Design System Expert Agent

## Project Goals

### Primary Objectives

1. ✅ Enable export of Figma variables as Design Tokens
2. ✅ Ensure compatibility with Adobe Spectrum visualizers and tooling
3. ✅ Preserve token relationships and metadata
4. ✅ Provide clear user feedback throughout the process
5. ✅ Prevent overwriting of existing Adobe Spectrum tokens

### Success Metrics

* Plugin loads and runs without errors in Figma
* Exported tokens validate against Design Tokens specification
* Exported tokens work with Adobe Spectrum visualizers
* User can complete export workflow in <30 seconds
* Test coverage >80% for core logic

## Project Structure

### Directory Organization

```
spectrum-tokens/
├── tools/
│   └── figma-plugin/              # NEW: Plugin codebase
│       ├── src/
│       │   ├── plugin/            # Backend (Figma sandbox)
│       │   │   ├── code.ts        # Main entry point
│       │   │   ├── variableScanner.ts
│       │   │   └── tokenExporter.ts
│       │   ├── ui/                # Frontend (iframe)
│       │   │   ├── ui.html
│       │   │   ├── ui.ts
│       │   │   └── components/
│       │   ├── mapping/           # Token conversion logic
│       │   │   ├── figmaToSpec.ts
│       │   │   ├── typeDetector.ts
│       │   │   ├── schemaMapper.ts
│       │   │   └── aliasResolver.ts
│       │   └── utils/             # Shared utilities
│       │       ├── uuid.ts
│       │       ├── validators.ts
│       │       ├── formatters.ts
│       │       └── fileSystem.ts
│       ├── test/                  # Test files
│       ├── docs/                  # Documentation
│       │   ├── REQUIREMENTS.md
│       │   ├── ARCHITECTURE.md
│       │   ├── FRONTEND_DEVELOPER_TASKS.md
│       │   └── DESIGN_SYSTEM_EXPERT_TASKS.md
│       ├── examples/              # Example exports
│       ├── manifest.json          # Figma plugin manifest
│       ├── package.json
│       ├── tsconfig.json
│       ├── moon.yml
│       └── README.md
│
└── exported-tokens/               # NEW: User token export location
    ├── README.md                  # Usage documentation
    └── [collection-name].json     # Exported token files
```

### Key Design Decisions

1. **Plugin Location:** `/tools/figma-plugin/`
   * Consistent with other tools in monorepo
   * Managed by moon task runner
   * Uses pnpm workspace

2. **Export Location:** `/exported-tokens/`
   * Separate from Adobe Spectrum tokens (`/packages/tokens/src/`)
   * Prevents accidental overwrites
   * Easy to gitignore or commit as needed
   * Clear separation of concerns

3. **Build System:** esbuild
   * Fast compilation
   * TypeScript support
   * Bundle size optimization
   * Watch mode for development

4. **Token Format:** Design Tokens spec + Adobe Spectrum extensions
   * `$value`, `$type`, `$description` (spec)
   * `$schema`, `uuid`, `component` (Spectrum)
   * Compatible with visualizers

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Set up project infrastructure

**Tasks:**

* [x] Create directory structure
* [x] Configure package.json with dependencies
* [x] Configure TypeScript
* [x] Configure moon task runner
* [ ] Create build system with esbuild (Frontend Developer)
* [ ] Add Figma type definitions (Frontend Developer)
* [ ] Set up test framework (Frontend Developer)

**Deliverables:**

* Working build system
* Plugin compiles without errors
* Tests can be run

**Dependencies:** None
**Risk:** Low

***

### Phase 2: Core Functionality (Week 2)

**Goal:** Implement token conversion logic

**Design System Expert Tasks:**

* [ ] Implement type detector (`src/mapping/typeDetector.ts`)
* [ ] Implement schema mapper (`src/mapping/schemaMapper.ts`)
* [ ] Implement value formatters (`src/utils/formatters.ts`)
* [ ] Implement UUID generator (`src/utils/uuid.ts`)
* [ ] Write unit tests for mapping logic

**Frontend Developer Tasks:**

* [ ] Implement variable scanner (`src/plugin/variableScanner.ts`)
* [ ] Set up Figma API integration
* [ ] Create basic file system utilities

**Deliverables:**

* Working type detection
* Working value conversion
* Figma variables can be scanned

**Dependencies:** Phase 1 complete
**Risk:** Medium (Figma API learning curve)

***

### Phase 3: Integration (Week 3)

**Goal:** Connect frontend and backend

**Design System Expert Tasks:**

* [ ] Implement main conversion function (`src/mapping/figmaToSpec.ts`)
* [ ] Implement validators (`src/utils/validators.ts`)
* [ ] Create example token exports

**Frontend Developer Tasks:**

* [ ] Implement plugin main entry point (`src/plugin/code.ts`)
* [ ] Implement token exporter (`src/plugin/tokenExporter.ts`)
* [ ] Set up UI/backend communication
* [ ] Implement file export mechanism

**Deliverables:**

* End-to-end conversion pipeline
* Tokens can be exported to files
* Basic validation working

**Dependencies:** Phase 2 complete
**Risk:** Medium (file system access limitations)

***

### Phase 4: User Interface (Week 4)

**Goal:** Build user-facing interface

**Frontend Developer Tasks:**

* [ ] Create UI HTML structure (`src/ui/ui.html`)
* [ ] Implement UI logic (`src/ui/ui.ts`)
* [ ] Create collection selector component
* [ ] Create status display component
* [ ] Add loading states and progress indicators
* [ ] Implement error handling in UI

**Design System Expert Tasks:**

* [ ] Review exported token format
* [ ] Test with Adobe Spectrum visualizers
* [ ] Create comprehensive examples

**Deliverables:**

* Functional UI
* User can select collections
* Clear feedback during export
* Error messages displayed

**Dependencies:** Phase 3 complete
**Risk:** Low

***

### Phase 5: Testing & Polish (Week 5)

**Goal:** Ensure quality and completeness

**Both Agents:**

* [ ] Integration testing with real Figma files
* [ ] Edge case testing
* [ ] Performance optimization
* [ ] Documentation review
* [ ] Create user guide
* [ ] Create developer documentation

**Test Cases:**

* [ ] Single collection export
* [ ] Multiple collection export
* [ ] All token types (color, dimension, opacity, etc.)
* [ ] Alias references
* [ ] Multiple modes (light/dark)
* [ ] Empty collections
* [ ] Large collections (>500 tokens)
* [ ] Circular alias references

**Deliverables:**

* > 80% test coverage
* All test cases passing
* Complete documentation
* Plugin ready for use

**Dependencies:** Phase 4 complete
**Risk:** Low

***

## Agent Task Allocation

### Frontend Developer Agent

**Primary Focus:** Infrastructure, UI, Figma API integration

**Files to Implement:**

```
src/plugin/code.ts              # Main plugin entry
src/plugin/variableScanner.ts   # Scan variables
src/plugin/tokenExporter.ts     # Export orchestration
src/ui/ui.html                  # UI structure
src/ui/ui.ts                    # UI logic
src/utils/fileSystem.ts         # File operations
build.js                        # Build configuration
test/plugin/*.test.ts           # Plugin tests
```

**Key Responsibilities:**

1. Build system with esbuild
2. Figma Plugin API integration
3. UI implementation
4. Message passing between UI and backend
5. File system operations
6. Integration testing

**Skills Required:**

* TypeScript
* Figma Plugin API
* esbuild
* HTML/CSS
* Testing (AVA)

**Estimated Effort:** 60% of project

***

### Design System Expert Agent

**Primary Focus:** Token mapping, conversion logic, validation

**Files to Implement:**

```
src/mapping/figmaToSpec.ts      # Main conversion
src/mapping/typeDetector.ts     # Type detection
src/mapping/schemaMapper.ts     # Schema assignment
src/mapping/aliasResolver.ts    # Alias handling
src/utils/uuid.ts               # UUID generation
src/utils/validators.ts         # Validation
src/utils/formatters.ts         # Value formatting
test/mapping/*.test.ts          # Mapping tests
examples/*.json                 # Example exports
```

**Key Responsibilities:**

1. Token type detection logic
2. Figma to Design Tokens conversion
3. Adobe Spectrum schema mapping
4. Value formatting (colors, numbers, aliases)
5. UUID generation
6. Validation logic
7. Example token creation
8. Unit testing of mapping logic

**Skills Required:**

* Design Tokens specification
* Adobe Spectrum token format
* TypeScript
* UUID standards
* JSON schema
* Testing (AVA)

**Estimated Effort:** 40% of project

***

## Technical Specifications

### Token Mapping Rules

| Figma Type | Detection Keywords           | Token Type | Schema           |
| ---------- | ---------------------------- | ---------- | ---------------- |
| COLOR      | -                            | color      | color.json       |
| FLOAT      | size, width, height, spacing | dimension  | dimension.json   |
| FLOAT      | opacity, alpha               | opacity    | opacity.json     |
| FLOAT      | scale, ratio, multiplier     | multiplier | multiplier.json  |
| STRING     | font-family, typeface        | fontFamily | font-family.json |
| STRING     | (alias reference)            | alias      | alias.json       |

### Value Formats

* **Colors:** Hex format `#RRGGBB` or `#RRGGBBAA`
* **Dimensions:** Numeric value (assume px)
* **Opacity:** 0-1 decimal
* **Aliases:** `{token-name}` format
* **UUIDs:** v4 format

### Required Token Properties

```json
{
  "$value": "...",              // Required: Token value
  "uuid": "...",                // Required: UUID v4
  "$schema": "...",             // Recommended: Schema URL
  "$type": "...",               // Optional: Token type
  "$description": "...",        // Optional: Description
  "component": "..."            // Optional: Component name
}
```

## Dependencies

### Runtime Dependencies

* `uuid`: ^11.0.3 - UUID generation

### Development Dependencies

* `typescript`: ^5.7.2 - TypeScript compilation
* `esbuild`: ^0.24.0 - Fast bundling
* `ava`: ^6.2.0 - Testing framework
* `prettier`: ^3.5.3 - Code formatting

### External Resources

* Figma Plugin API documentation
* Design Tokens Community Group specification
* Adobe Spectrum token schemas

## Risk Assessment

### High-Priority Risks

1. **Figma File System Access**
   * **Risk:** Figma plugins may not have direct file system access
   * **Mitigation:** Research API capabilities, implement download fallback
   * **Owner:** Frontend Developer

2. **Complex Alias Chains**
   * **Risk:** Circular references or deep nesting may cause issues
   * **Mitigation:** Implement cycle detection, limit depth
   * **Owner:** Design System Expert

3. **Type Detection Accuracy**
   * **Risk:** Keyword-based detection may misclassify tokens
   * **Mitigation:** Comprehensive testing, allow manual override (future)
   * **Owner:** Design System Expert

### Medium-Priority Risks

4. **Performance with Large Files**
   * **Risk:** Files with >1000 variables may be slow
   * **Mitigation:** Optimize algorithms, show progress, consider batching
   * **Owner:** Frontend Developer

5. **Multiple Modes Complexity**
   * **Risk:** Light/dark mode handling may be complex
   * **Mitigation:** Start with single mode, add multi-mode in v2
   * **Owner:** Both

### Low-Priority Risks

6. **Browser Compatibility**
   * **Risk:** UI may not work in all browsers
   * **Mitigation:** Test in supported Figma environments only
   * **Owner:** Frontend Developer

## Communication & Coordination

### Daily Standup (Async)

* What did you complete?
* What are you working on?
* Any blockers?

### Code Review Process

1. Create feature branch
2. Implement and test
3. Request review from other agent
4. Address feedback
5. Merge to main

### Integration Points

**Week 2 Integration:**

* Design System Expert provides type detector
* Frontend Developer integrates into scanner

**Week 3 Integration:**

* Frontend Developer provides scanned variables
* Design System Expert converts to tokens
* Frontend Developer exports to files

**Week 4 Integration:**

* Frontend Developer builds UI
* Design System Expert tests with visualizers

## Documentation Deliverables

### User Documentation

* [ ] README with quick start guide
* [ ] Step-by-step usage instructions
* [ ] Troubleshooting guide
* [ ] FAQ

### Developer Documentation

* [ ] Architecture overview ✅
* [ ] API documentation
* [ ] Contributing guide
* [ ] Testing guide

### Examples

* [ ] Example Figma file with variables
* [ ] Example exported tokens
* [ ] Example usage with visualizers

## Definition of Done

A task is considered done when:

* [ ] Code is implemented and follows TypeScript best practices
* [ ] Unit tests are written and passing
* [ ] Code is formatted with Prettier
* [ ] Code is reviewed by other agent
* [ ] Documentation is updated
* [ ] No lint errors or warnings

## Success Criteria (Final)

### Minimum Viable Product (MVP)

* [x] Plugin structure created
* [x] Documentation complete
* [ ] Plugin loads in Figma
* [ ] User can scan collections
* [ ] User can select collections
* [ ] User can export tokens
* [ ] Tokens are valid Design Tokens format
* [ ] Tokens include Spectrum metadata
* [ ] Tokens work in visualizers

### Version 1.0 Release

* [ ] All token types supported
* [ ] Alias references preserved
* [ ] Validation before export
* [ ] Error handling
* [ ] Progress indicators
* [ ] \>80% test coverage
* [ ] Complete documentation
* [ ] Integration tested with visualizers

## Next Steps

### Immediate Actions (This Week)

**Frontend Developer:**

1. Create `build.js` with esbuild configuration
2. Add Figma type definitions
3. Implement basic plugin entry point
4. Test plugin loads in Figma

**Design System Expert:**

1. Implement `typeDetector.ts` with keyword matching
2. Implement `schemaMapper.ts` with schema URLs
3. Write unit tests for type detection
4. Create example token files

### Week 2 Goals

* Working variable scanner
* Working type detection
* Integration: scanner → detector

### Questions to Resolve

1. Does Figma Plugin API allow file system writes? (Frontend Developer to research)
2. Should we support all modes or just default mode in v1? (Decision: default mode only)
3. How to handle Boolean type (not in Design Tokens spec)? (Decision: export as string)

## Appendix

### Useful Links

* [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
* [Design Tokens Spec](https://design-tokens.github.io/community-group/format/)
* [Adobe Spectrum Tokens Repo](https://github.com/adobe/spectrum-tokens)
* [S2 Visualizer](https://opensource.adobe.com/spectrum-tokens/s2-visualizer/)

### File Locations

* Plugin source: `/Users/HF48VKQ/Documents/GitHub/spectrum-tokens/tools/figma-plugin/`
* Export destination: `/Users/HF48VKQ/Documents/GitHub/spectrum-tokens/exported-tokens/`
* Spectrum tokens: `/Users/HF48VKQ/Documents/GitHub/spectrum-tokens/packages/tokens/src/`
* Token schemas: `/Users/HF48VKQ/Documents/GitHub/spectrum-tokens/docs/site/public/schemas/token-types/`

### Contact

* Issues: <https://github.com/adobe/spectrum-tokens/issues>
* Discussions: <https://github.com/adobe/spectrum-tokens/discussions>

***

**Document Version:** 1.0
**Last Updated:** 2024-11-18
**Status:** Approved - Ready for Implementation
