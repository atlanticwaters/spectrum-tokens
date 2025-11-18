# Figma Plugin Architecture - Visual Diagrams

This document provides detailed visual representations of the plugin architecture, data flow, and component interactions.

***

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FIGMA DESKTOP APP                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    PLUGIN INSTANCE                         │ │
│  │                                                            │ │
│  │  ┌──────────────────┐         ┌──────────────────────┐   │ │
│  │  │   UI IFRAME      │         │   CODE SANDBOX       │   │ │
│  │  │  (HTML/CSS/JS)   │◄───────►│   (TypeScript)       │   │ │
│  │  │                  │postMsg  │                      │   │ │
│  │  │  React App       │         │  Figma API Access    │   │ │
│  │  │  User Interface  │         │  Business Logic      │   │ │
│  │  └──────────────────┘         └──────────────────────┘   │ │
│  │                                         │                  │ │
│  └─────────────────────────────────────────┼──────────────────┘ │
│                                            │                    │
│  ┌─────────────────────────────────────────▼──────────────────┐ │
│  │                  FIGMA VARIABLES API                        │ │
│  │  • getLocalVariableCollectionsAsync()                      │ │
│  │  • getVariableByIdAsync()                                  │ │
│  │  • getVariableCollectionByIdAsync()                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                            │                    │
└────────────────────────────────────────────┼────────────────────┘
                                             │
                                             ▼
                                  ┌──────────────────┐
                                  │  Design Tokens   │
                                  │   JSON Files     │
                                  │  (Downloaded)    │
                                  └──────────────────┘
```

***

## 2. Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            UI LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐   ┌────────────────────┐                   │
│  │  App.tsx           │   │  Components/       │                   │
│  │  ─────────         │   │  ────────────      │                   │
│  │  • State mgmt      │──►│  • CollectionSelector.tsx              │
│  │  • Message handler │   │  • SettingsPanel.tsx                   │
│  │  • UI orchestration│   │  • ProgressIndicator.tsx               │
│  └────────────────────┘   │  • ExportResults.tsx                   │
│           │               │  • ErrorDisplay.tsx                     │
│           │               └────────────────────┘                   │
│           │                                                          │
│           │  postMessage()                                          │
│           ▼                                                          │
└───────────┼──────────────────────────────────────────────────────────┘
            │
            │ {type, config, data}
            │
┌───────────▼──────────────────────────────────────────────────────────┐
│                         CODE LAYER                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────┐                                              │
│  │  code.ts           │  Main plugin orchestrator                    │
│  │  ────────          │                                              │
│  │  • Message router  │                                              │
│  │  • Service init    │                                              │
│  │  • Error handler   │                                              │
│  └────────────────────┘                                              │
│           │                                                           │
│           ├──────────────┬──────────────┬──────────────┐            │
│           ▼              ▼              ▼              ▼            │
│  ┌────────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐      │
│  │ API Layer  │  │Conversion│  │   Export   │  │  Utils    │      │
│  │ ──────────│  │  Layer   │  │   Layer    │  │  ─────    │      │
│  │            │  │ ──────── │  │ ────────── │  │           │      │
│  │ • FigmaAPI │  │ • Type   │  │ • FileGen  │  │ • UUID    │      │
│  │ • Reader   │  │   Mapper │  │ • Validator│  │ • Logger  │      │
│  │ • Resolver │  │ • Value  │  │ • Formatter│  │ • Error   │      │
│  │            │  │   Transform│ │            │  │   Handler │      │
│  │            │  │ • Token  │  │            │  │           │      │
│  │            │  │   Converter│ │            │  │           │      │
│  └────────────┘  │ • Alias  │  │            │  │           │      │
│         │        │   Resolver│  │            │  │           │      │
│         │        │ • Mode   │  │            │  │           │      │
│         │        │   Handler│  │            │  │           │      │
│         │        └──────────┘  └────────────┘  └───────────┘      │
│         │                                                           │
│         │ Figma API calls                                          │
│         ▼                                                           │
└─────────┼───────────────────────────────────────────────────────────┘
          │
          │ figma.variables.getLocalVariableCollectionsAsync()
          │ figma.variables.getVariableByIdAsync()
          │
┌─────────▼───────────────────────────────────────────────────────────┐
│                      FIGMA VARIABLES API                            │
├─────────────────────────────────────────────────────────────────────┤
│  • Variable Collections                                             │
│  • Variables (with modes)                                           │
│  • Variable aliases/references                                      │
└─────────────────────────────────────────────────────────────────────┘
```

***

## 3. Data Flow Diagram

### 3.1 Collection Loading Flow

```
┌──────┐
│ User │ Opens plugin
└──┬───┘
   │
   ▼
┌──────────────┐
│ UI: App.tsx  │ useEffect() → postMessage(FETCH_COLLECTIONS)
└──┬───────────┘
   │
   │ postMessage
   ▼
┌─────────────────┐
│ Plugin: code.ts │ Receives FETCH_COLLECTIONS message
└──┬──────────────┘
   │
   │ calls
   ▼
┌──────────────────────┐
│ CollectionReader     │ getCollectionSummaries()
└──┬───────────────────┘
   │
   │ calls
   ▼
┌──────────────────────┐
│ FigmaVariablesAPI    │ getLocalCollections()
└──┬───────────────────┘
   │
   │ async call
   ▼
┌───────────────────────────────────┐
│ figma.variables.                  │
│ getLocalVariableCollectionsAsync()│
└──┬────────────────────────────────┘
   │
   │ returns VariableCollection[]
   ▼
┌──────────────────────┐
│ CollectionReader     │ Maps to CollectionSummary[]
└──┬───────────────────┘
   │
   │ returns
   ▼
┌─────────────────┐
│ Plugin: code.ts │ postMessage(COLLECTIONS_LOADED)
└──┬──────────────┘
   │
   │ postMessage
   ▼
┌──────────────┐
│ UI: App.tsx  │ Receives collections, updates state
└──┬───────────┘
   │
   │ setState(collections)
   ▼
┌─────────────────────┐
│ CollectionSelector  │ Renders collection list
└─────────────────────┘
   │
   │ User sees collections
   ▼
```

### 3.2 Export Flow

```
┌──────┐
│ User │ Selects collections + clicks Export
└──┬───┘
   │
   ▼
┌──────────────┐
│ UI: App.tsx  │ Validates, postMessage(EXPORT_TOKENS, config)
└──┬───────────┘
   │
   │ postMessage
   ▼
┌─────────────────┐
│ Plugin: code.ts │ handleExportTokens(config)
└──┬──────────────┘
   │
   │ Step 1: Build resolver cache
   ├──────────────────────────────►┌──────────────────┐
   │                               │ VariableResolver │
   │                               │ buildCache()     │
   │                               └──────────────────┘
   │
   │ Step 2: For each collection
   ├──┐
   │  │ Loop: collectionIds
   │  ▼
   │  ┌──────────────────┐
   │  │ CollectionReader │ getCollectionData(id)
   │  └──┬───────────────┘
   │     │
   │     │ returns {collection, variables}
   │     ▼
   │  ┌──────────────────┐
   │  │ TokenConverter   │ convertCollection(data)
   │  └──┬───────────────┘
   │     │
   │     │ For each variable:
   │     ├──────────────►┌────────────┐
   │     │               │ TypeMapper │ mapType(), inferSpecificType()
   │     │               └────────────┘
   │     │
   │     ├──────────────►┌──────────────────┐
   │     │               │ ValueTransformer │ transformValue()
   │     │               └──────────────────┘
   │     │
   │     │ If alias:
   │     ├──────────────►┌──────────────────┐
   │     │               │ VariableResolver │ getVariableReferencePath()
   │     │               └──────────────────┘
   │     │
   │     │ returns TokenGroup
   │     ▼
   │  Store in Map<collectionName, TokenGroup>
   │  │
   │  │ postMessage(EXPORT_PROGRESS, %)
   │  ▼
   │  ┌──────────────┐
   │  │ UI: App.tsx  │ Updates progress bar
   │  └──────────────┘
   │◄─┘
   │
   │ Step 3: Generate files
   ├──────────────────────────────►┌──────────────┐
   │                               │ FileGenerator│ generateFiles()
   │                               └──┬───────────┘
   │                                  │
   │                                  │ calls
   │                                  ▼
   │                               ┌──────────┐
   │                               │Formatter │ format()
   │                               └──────────┘
   │                                  │
   │                                  │ returns ExportedFile[]
   │                                  ▼
   │
   │ Step 4: Validate
   ├──────────────────────────────►┌───────────┐
   │                               │ Validator │ validate()
   │                               └───────────┘
   │                                  │
   │                                  │ returns ValidationResult
   │                                  ▼
   │
   │ Step 5: Trigger download
   │ postMessage(EXPORT_SUCCESS, files)
   │
   │ postMessage
   ▼
┌──────────────┐
│ UI: App.tsx  │ Shows success state
└──┬───────────┘
   │
   │ setState('success')
   ▼
┌─────────────────┐
│ ExportResults   │ Displays files, download link
└─────────────────┘
   │
   │ User downloads files
   ▼
```

***

## 4. Type Conversion Flow

```
┌─────────────────────┐
│  Figma Variable     │
│  ───────────────    │
│  name: "color/bg"   │
│  type: COLOR        │
│  value: {r,g,b,a}   │
│  modes: [L, D]      │
└──┬──────────────────┘
   │
   │ 1. Map type
   ▼
┌──────────────────┐
│  TypeMapper      │
│  ────────────    │
│  COLOR → 'color' │
└──┬───────────────┘
   │
   │ 2. Transform value
   ▼
┌───────────────────────┐
│  ValueTransformer     │
│  ─────────────────    │
│  {r:1,g:0,b:0,a:1}    │
│  → "#FF0000"          │
└──┬────────────────────┘
   │
   │ 3. Create token
   ▼
┌─────────────────────────────┐
│  Design Token               │
│  ─────────────              │
│  {                          │
│    $value: "#FF0000",       │
│    $type: "color",          │
│    $description: "...",     │
│    $extensions: {           │
│      "com.figma": {         │
│        variableId: "...",   │
│        collectionId: "...", │
│        modeId: "..."        │
│      }                      │
│    }                        │
│  }                          │
└─────────────────────────────┘
```

***

## 5. Alias Resolution Flow

```
Variable: "button-background"
  └─ Value: VARIABLE_ALIAS → "color/primary/500"

┌──────────────────────┐
│ TokenConverter       │
│ detects alias        │
└──┬───────────────────┘
   │
   │ calls
   ▼
┌──────────────────────┐
│ VariableResolver     │
│ getVariableReferencePath(aliasId)
└──┬───────────────────┘
   │
   │ 1. Lookup variable in cache
   ├─────────────────►┌──────────────────┐
   │                  │ variableCache    │
   │                  │ Map<id, variable>│
   │◄─────────────────┤ returns variable │
   │                  └──────────────────┘
   │
   │ 2. Get variable name
   │    name: "color/primary/500"
   │
   │ 3. Convert to token path
   │    "color/primary/500" → "color.primary.500"
   │
   │ 4. Wrap in token reference syntax
   │    "color.primary.500" → "{color.primary.500}"
   │
   │ returns
   ▼
┌─────────────────────────┐
│ Token with alias        │
│ ───────────────         │
│ {                       │
│   $value: "{color.primary.500}",
│   $type: "color"        │
│ }                       │
└─────────────────────────┘
```

***

## 6. Mode Handling Flow

```
Variable: "background-color"
Modes:
  - Light (id: "1:0"): #FFFFFF
  - Dark (id: "1:1"): #000000

┌──────────────────────┐
│ TokenConverter       │
│ config.includeModes = true
└──┬───────────────────┘
   │
   │ For each mode:
   ├──┐
   │  │ Mode: Light
   │  ├─────────────►┌──────────────────┐
   │  │              │ Get value for    │
   │  │              │ mode "1:0"       │
   │  │              │ → #FFFFFF        │
   │  │              └──────────────────┘
   │  │
   │  │ Mode: Dark
   │  └─────────────►┌──────────────────┐
   │                 │ Get value for    │
   │                 │ mode "1:1"       │
   │                 │ → #000000        │
   │                 └──────────────────┘
   │
   │ Create mode-specific tokens
   ▼
┌───────────────────────────────┐
│ Token structure (multi-mode)  │
│ ─────────────────────────     │
│ "background-color": {         │
│   "light": {                  │
│     $value: "#FFFFFF",        │
│     $type: "color",           │
│     $extensions: {            │
│       "com.figma": {          │
│         modeId: "1:0"         │
│       }                       │
│     }                         │
│   },                          │
│   "dark": {                   │
│     $value: "#000000",        │
│     $type: "color",           │
│     $extensions: {            │
│       "com.figma": {          │
│         modeId: "1:1"         │
│       }                       │
│     }                         │
│   }                           │
│ }                             │
└───────────────────────────────┘
```

***

## 7. Error Handling Flow

```
┌─────────────────┐
│ Any Component   │
│ throws Error    │
└──┬──────────────┘
   │
   │ try/catch
   ▼
┌─────────────────────┐
│ ErrorHandler        │
│ handleError(error)  │
└──┬──────────────────┘
   │
   │ 1. Identify error type
   ├──►[PluginError]────►Known error, has code
   │
   └──►[Error]──────────►Unknown error, wrap in PluginError
   │
   │ 2. Log to console
   ├──────────────────►┌──────────────┐
   │                   │ console.error│
   │                   └──────────────┘
   │
   │ 3. Get user message
   ├──────────────────►┌──────────────────────┐
   │                   │ getUserMessage(code) │
   │                   │ Returns friendly msg │
   │                   └──────────────────────┘
   │
   │ 4. Send to UI
   │ postMessage(EXPORT_ERROR)
   ▼
┌──────────────┐
│ UI: App.tsx  │ Receives error
└──┬───────────┘
   │
   │ setState('error')
   ▼
┌─────────────────┐
│ ErrorDisplay    │ Shows error + suggestions
└─────────────────┘
   │
   │ User sees:
   │ - Error message
   │ - Recovery suggestions
   │ - [Try Again] button
   ▼
```

***

## 8. Message Protocol

### Message Types

```
UI → Plugin:
  FETCH_COLLECTIONS   → Request collections from Figma
  EXPORT_TOKENS       → Start export with config
  CANCEL_EXPORT       → Cancel ongoing export

Plugin → UI:
  COLLECTIONS_LOADED  → Send collections data
  EXPORT_PROGRESS     → Send progress updates (0-100%)
  EXPORT_SUCCESS      → Send export results
  EXPORT_ERROR        → Send error info
  VALIDATION_ERROR    → Send validation errors
```

### Message Flow Timeline

```
Time →
  0ms   UI: FETCH_COLLECTIONS ──────────►
                                         Plugin: Fetch from Figma
  50ms                                   Plugin: Processing...
 100ms  ◄────── COLLECTIONS_LOADED       Plugin: Send data
 200ms  UI: Render collections
        User selects, configures
 500ms  UI: EXPORT_TOKENS ──────────────►
                                         Plugin: Start export
 600ms  ◄────── EXPORT_PROGRESS (10%)   Plugin: Building cache
 800ms  ◄────── EXPORT_PROGRESS (30%)   Plugin: Converting collection 1
1000ms  ◄────── EXPORT_PROGRESS (60%)   Plugin: Converting collection 2
1200ms  ◄────── EXPORT_PROGRESS (90%)   Plugin: Validating
1300ms  ◄────── EXPORT_SUCCESS           Plugin: Done!
        UI: Show results
```

***

## 9. File Structure Visualization

```
figma-spectrum-tokens-exporter/
│
├── manifest.json                 ← Figma plugin manifest
├── package.json                  ← Dependencies
├── tsconfig.json                 ← TypeScript config
├── moon.yml                      ← Moon tasks
├── ava.config.js                 ← Test config
│
├── src/
│   ├── ui/                       ← UI Layer (iframe)
│   │   ├── index.html
│   │   ├── ui.tsx                ← Main React app
│   │   ├── components/
│   │   │   ├── CollectionSelector.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ProgressIndicator.tsx
│   │   │   ├── ExportResults.tsx
│   │   │   └── ErrorDisplay.tsx
│   │   └── styles/
│   │       └── main.css
│   │
│   ├── plugin/                   ← Code Layer (sandbox)
│   │   ├── code.ts               ← Plugin entry point
│   │   ├── api/                  ← Figma API access
│   │   │   ├── FigmaVariablesAPI.ts
│   │   │   ├── CollectionReader.ts
│   │   │   └── VariableResolver.ts
│   │   ├── conversion/           ← Token conversion
│   │   │   ├── TokenConverter.ts
│   │   │   ├── TypeMapper.ts
│   │   │   ├── ValueTransformer.ts
│   │   │   ├── AliasResolver.ts
│   │   │   └── ModeHandler.ts
│   │   ├── export/               ← File generation
│   │   │   ├── FileGenerator.ts
│   │   │   ├── Validator.ts
│   │   │   └── Formatter.ts
│   │   └── utils/
│   │       ├── uuid.ts
│   │       ├── logger.ts
│   │       └── error-handler.ts
│   │
│   └── shared/                   ← Shared types/constants
│       ├── types/
│       │   ├── figma-types.ts
│       │   ├── token-types.ts
│       │   ├── plugin-messages.ts
│       │   └── config-types.ts
│       └── constants/
│           ├── message-types.ts
│           └── defaults.ts
│
└── test/                         ← Tests
    ├── unit/
    │   ├── TypeMapper.test.ts
    │   ├── ValueTransformer.test.ts
    │   └── Validator.test.ts
    └── fixtures/
        └── sample-collections.json
```

***

## 10. Deployment & Usage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT                              │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ 1. Build
            │ pnpm build
            ▼
         ┌──────┐
         │ dist/│
         │ ├─code.js
         │ └─ui.html
         └──────┘
            │
            │ 2. Load in Figma
            │ Plugins → Development → Import plugin from manifest
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     FIGMA DESKTOP                            │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ 3. User runs plugin
            │ Plugins → Spectrum Design Tokens Exporter
            ▼
         ┌────────┐
         │ Plugin │
         │ Window │
         └────────┘
            │
            │ 4. User exports tokens
            ▼
      ┌──────────────┐
      │ Downloads    │
      │ JSON files   │
      └──────────────┘
            │
            │ 5. User uses tokens
            ├──────────────────┬──────────────────┬────────────────┐
            ▼                  ▼                  ▼                ▼
     ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐
     │ Visualizer   │  │ S2 Visualizer│ │ Tokens      │  │ Design     │
     │              │  │              │  │ Viewer      │  │ System     │
     └──────────────┘  └─────────────┘  └─────────────┘  └────────────┘
```

***

## 11. State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI STATE MACHINE                            │
└─────────────────────────────────────────────────────────────────┘

                         ┌───────────┐
                         │  LOADING  │ Initial state
                         └─────┬─────┘
                               │
                     COLLECTIONS_LOADED
                               │
                               ▼
                         ┌───────────┐
                    ┌───►│ SELECTING │◄──┐
                    │    └─────┬─────┘   │
                    │          │          │
                    │    User clicks      │
              TRY_AGAIN    Export         │
                    │          │          │
                    │          ▼          │
                    │    ┌───────────┐   │
                    │    │ EXPORTING │   │
                    │    └─────┬─────┘   │
                    │          │          │
                    │     ┌────┴────┐    │
                    │     │         │    │
              EXPORT_ERROR│         │EXPORT_SUCCESS
                    │     │         │    │
                    │     ▼         ▼    │
                    │  ┌──────┐  ┌─────────┐
                    └──┤ERROR │  │ SUCCESS │
                       └──────┘  └────┬────┘
                                      │
                               EXPORT_AGAIN
                                      │
                                      └────┘
```

***

This architecture ensures:

* Clear separation of concerns
* Type-safe data flow
* Robust error handling
* Scalable and maintainable code structure
* Testable components
