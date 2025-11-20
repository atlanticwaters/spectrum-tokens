# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Adobe Spectrum Figma Plugin.

## Project Context

This is a Figma plugin for exporting design tokens from Figma variables to Adobe Spectrum's token format. The plugin is being migrated to React and expanded to achieve feature parity with the Token Studio plugin.

## Development Commands

### Common Commands
- `pnpm install` - Install dependencies
- `pnpm build` - Build plugin for production
- `pnpm build --watch` - Build in watch mode for development
- `pnpm test` - Run all tests
- `pnpm test -- --watch` - Run tests in watch mode
- `pnpm format` - Format code with Prettier

### Testing in Figma
1. Build the plugin: `pnpm build`
2. In Figma: Plugins > Development > Import plugin from manifest
3. Select: `tools/figma-plugin/manifest.json`
4. Test with a Figma file that has variable collections

## Architecture Overview

### Dual-Thread Architecture
Following the pattern from Token Studio, this plugin uses a dual-thread architecture:

1. **Main Thread (Plugin Code)**: `src/plugin/code.ts`
   - Runs in Figma's plugin sandbox environment
   - Has access to Figma API but NO DOM access
   - Handles all Figma API operations (reading variables, creating styles, etc.)
   - Communicates with UI via `postMessage`

2. **UI Thread (React App)**: `src/ui/App.tsx`
   - Runs in an iframe with DOM access but NO Figma API access
   - React application with state management
   - Handles user interactions and UI rendering
   - Communicates with plugin code via `postMessage`

### Directory Structure

```
tools/figma-plugin/
├── src/
│   ├── plugin/              # Plugin-side code (Figma sandbox)
│   │   ├── code.ts          # Main entry point
│   │   └── variableScanner.ts
│   │
│   ├── ui/                  # UI-side code (React app in iframe)
│   │   ├── App.tsx          # React root component
│   │   ├── components/      # React components
│   │   ├── store/           # Redux store (if using Redux)
│   │   └── hooks/           # Custom React hooks
│   │
│   ├── storage/             # Storage provider implementations
│   │   ├── IStorageProvider.ts
│   │   ├── GithubStorage.ts
│   │   └── LocalStorage.ts
│   │
│   ├── mapping/             # Token type mapping logic
│   │   ├── typeDetector.ts
│   │   ├── valueTransformer.ts
│   │   └── tokenConverter.ts
│   │
│   ├── export/              # Export logic
│   │   ├── fileGenerator.ts
│   │   └── exportCoordinator.ts
│   │
│   ├── shared/              # Shared types between plugin and UI
│   │   └── types.ts
│   │
│   └── utils/               # Utility functions
│       ├── validators.ts
│       └── uuid.ts
│
├── test/                    # Test files
├── dist/                    # Build output (gitignored)
├── manifest.json            # Figma plugin manifest
├── package.json
└── tsconfig.json
```

### Communication Pattern

**Critical:** The plugin and UI run in separate contexts and can only communicate via `postMessage`.

#### From UI to Plugin:
```typescript
// In React component
parent.postMessage({
  pluginMessage: {
    type: 'export-tokens',
    payload: { selections, settings }
  }
}, '*');
```

#### From Plugin to UI:
```typescript
// In plugin code.ts
figma.ui.postMessage({
  type: 'collections-scanned',
  payload: { collections }
});
```

#### Message Handler Pattern:
```typescript
// In plugin code.ts
figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'scan-collections':
      // Handle message
      break;
    case 'export-tokens':
      // Handle message
      break;
  }
};

// In UI
window.onmessage = (event) => {
  const msg = event.data.pluginMessage as PluginResponse;
  switch (msg.type) {
    case 'collections-scanned':
      // Update React state
      break;
  }
};
```

### State Management

**Current:** Simple local state in React components
**Planned:** Redux Toolkit for complex state management

When implementing Redux:
- Store configuration in `src/ui/store/index.ts`
- Create slices for different domains (collections, settings, storage, tokens, ui)
- Use Redux Toolkit's `createSlice` and `configureStore`
- Persist critical state to Figma's plugin storage

### Token Processing Pipeline

1. **Scan** - Read Figma variable collections (`src/plugin/variableScanner.ts`)
2. **Detect Types** - Identify token types (`src/mapping/typeDetector.ts`)
3. **Transform Values** - Convert to DTCG format (`src/mapping/valueTransformer.ts`)
4. **Map Schema** - Assign Spectrum schemas (`src/mapping/schemaMapper.ts`)
5. **Convert** - Build complete token structure (`src/mapping/tokenConverter.ts`)
6. **Export** - Generate output files (`src/export/fileGenerator.ts`)
7. **Download** - Trigger browser downloads (UI side)

### Storage Providers

Storage providers enable syncing tokens with external services:

**Interface:**
```typescript
interface IStorageProvider {
  name: string;
  canRead: boolean;
  canWrite: boolean;
  read(): Promise<TokenData>;
  write(data: TokenData): Promise<void>;
  authenticate?(): Promise<void>;
}
```

**Implemented:**
- (Planned) GitHub - OAuth + Octokit API
- (Planned) Local Storage - Browser localStorage
- (Planned) URL Storage - Read-only HTTP fetch

**Reference:** Token Studio has excellent examples in `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/storage/`

### Build System

**Bundler:** esbuild (faster than webpack, simpler config)
**TypeScript:** Strict mode enabled
**Output:**
- `dist/code.js` - Plugin code bundle
- `dist/ui.js` - UI React app bundle
- `dist/ui.html` - UI HTML wrapper

**Build Configuration:** `build.js`
- Uses esbuild API
- Supports watch mode for development
- Separate bundles for plugin and UI
- TypeScript compilation included

## Code Standards

### TypeScript
- Use strict mode (`strict: true` in tsconfig.json)
- Explicit types for all function parameters and return values
- Use interfaces for object shapes
- Avoid `any` - use `unknown` if type is truly unknown

### React Patterns
- Functional components with hooks (no class components)
- Custom hooks for reusable logic (prefix with `use`)
- Props interfaces for all components
- Use React.memo() for expensive components
- Prefer composition over prop drilling

### Naming Conventions
- Components: PascalCase (`Button.tsx`, `TokenBrowser.tsx`)
- Hooks: camelCase with `use` prefix (`usePluginMessage`, `useTokens`)
- Utilities: camelCase (`validateToken`, `formatColor`)
- Types/Interfaces: PascalCase (`PluginMessage`, `TokenData`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_EXPORT_SETTINGS`)

### File Organization
- One component per file
- Co-locate tests with source: `Button.tsx` + `Button.test.tsx`
- Group related files in directories
- Barrel exports via `index.ts` for cleaner imports

### Error Handling
- Use try/catch for async operations
- Provide meaningful error messages to users
- Log errors for debugging: `console.error('Context:', error)`
- Handle Figma API errors gracefully (fonts not loaded, nodes not found, etc.)

### Testing
- Write tests for all new features
- Test files: `*.test.ts` or `*.test.tsx`
- Use Jest + React Testing Library
- Aim for 80%+ code coverage
- Test edge cases and error conditions

## Figma API Gotchas

### Font Loading
Always load fonts before changing text properties:
```typescript
await figma.loadFontAsync({
  family: 'Inter',
  style: 'Regular'
});
node.fontName = { family: 'Inter', style: 'Regular' };
```

### Async Operations
Most Figma API operations are async:
```typescript
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variable = await figma.variables.getVariableByIdAsync(id);
```

### Node Type Checking
Always check node type before accessing type-specific properties:
```typescript
if ('fills' in node && node.fills !== figma.mixed) {
  // Safe to access fills
}

if (node.type === 'TEXT') {
  // node is TextNode, has text properties
}
```

### Plugin Storage
Store data that persists between sessions:
```typescript
// Set
await figma.clientStorage.setAsync('key', value);

// Get
const value = await figma.clientStorage.getAsync('key');
```

## Reference Implementations

### Token Studio Plugin
Location: `tools/figma-plugin-ts/packages/tokens-studio-for-figma/`

**Key files to reference:**
- `src/plugin/controller.ts` - Plugin architecture pattern
- `src/app/index.tsx` - React app initialization
- `src/AsyncMessageChannel.ts` - Message passing pattern
- `src/storage/GithubTokenStorage.ts` - Storage provider example
- `src/plugin/apply*ValuesOnNode.ts` - Token application patterns
- `src/app/store.ts` - Redux store setup

**What to learn:**
- Dual-thread communication patterns
- Storage provider abstractions
- Token application to different node types
- State management with Redux
- Error handling strategies

**What to adapt (not copy):**
- Keep esbuild instead of webpack
- Simpler state management (Redux Toolkit vs Rematch)
- Adobe Spectrum-specific features
- Leaner dependency list

## Migration Strategy

### Phase 1: React Foundation
- Keep existing functionality working
- Migrate UI incrementally to React
- One component at a time
- Maintain backward compatibility

### Phase 2: Storage Providers
- GitHub first (most common)
- Abstract base class pattern from Token Studio
- Local storage for offline use
- Document how to add new providers

### Phase 3: Token Application
- Study Token Studio's `apply*ValuesOnNode.ts` files
- Implement color, typography, spacing, etc.
- Add comprehensive error handling
- Test with various node types

### Phase 4: Advanced Features
- Styles management
- Variables management
- Theme system
- Bulk operations

## Development Workflow

### Daily Workflow
```bash
# Start development
pnpm build --watch        # Terminal 1: Auto-rebuild on changes
pnpm test -- --watch      # Terminal 2: Auto-run tests

# Make changes to src/ui/App.tsx or src/plugin/code.ts
# Plugin auto-reloads in Figma (may need to close/reopen plugin UI)
# Tests auto-run

# Before committing
pnpm format              # Format code
pnpm test                # Run all tests
pnpm build               # Verify production build
```

### Testing in Figma
1. Create test Figma file with variables:
   - Color variables (solid colors, aliases)
   - Number variables (dimensions, opacity)
   - String variables (font families)
   - Collections with multiple modes
2. Import plugin from manifest
3. Test each feature systematically
4. Check browser console for errors (Cmd+Option+I in Figma)

### Debugging
- **Plugin code:** `console.log()` appears in Figma's DevTools console
- **UI code:** `console.log()` appears in UI's DevTools console (right-click plugin UI > Inspect)
- Use breakpoints in DevTools
- React DevTools extension for component inspection
- Redux DevTools extension for state inspection

## Common Issues

### Issue: Plugin won't load
- Check `manifest.json` is valid JSON
- Verify `dist/code.js` and `dist/ui.html` exist
- Check Figma console for errors

### Issue: UI not updating
- Verify message passing is correct (`pluginMessage` wrapper)
- Check React state is updating
- Ensure UI is listening to correct message types

### Issue: "Cannot read property X of null"
- Check node exists before accessing properties
- Verify variable/collection still exists
- Handle deleted/renamed items gracefully

### Issue: Fonts not loading
- Always use `figma.loadFontAsync()` before changing fonts
- Handle missing fonts gracefully
- Provide fallback fonts

### Issue: Build fails
- Clear dist: `rm -rf dist && pnpm build`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct

## Best Practices

### Performance
- Batch Figma API operations when possible
- Use virtualization for long lists
- Debounce expensive operations
- Cache frequently accessed data
- Lazy load heavy components

### Security
- Never commit tokens/credentials
- Sanitize user input
- Validate data from external sources
- Use HTTPS for API calls

### User Experience
- Show loading states for async operations
- Provide clear error messages with recovery steps
- Add progress indicators for long operations
- Persist user settings
- Support keyboard navigation

### Code Quality
- Write self-documenting code
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable names
- Extract magic numbers to constants

## Resources

### Documentation
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Design Tokens Spec](https://design-tokens.github.io/community-group/format/)
- [React Docs](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [esbuild](https://esbuild.github.io/)

### Project Documentation
- `FEATURE_PARITY_PLAN.md` - Strategic roadmap
- `IMPLEMENTATION_CHECKLIST.md` - Detailed task list
- `DEVELOPER_QUICKSTART.md` - Quick start guide
- `README.md` - Plugin overview

### Reference Code
- Token Studio Plugin: `tools/figma-plugin-ts/`
- Token Studio CLAUDE.md: `tools/figma-plugin-ts/CLAUDE.md`

## Notes for AI Assistants

When working on this codebase:
- **Reference Token Studio** for patterns, but don't copy blindly
- **Keep it lean** - we don't need all Token Studio features
- **Test everything** - add tests for new features
- **Document changes** - update README and inline docs
- **Ask questions** - clarify requirements before implementing
- **Incremental progress** - small, working changes are better than big broken ones

## Current Status

**Phase:** Planning complete, ready for Phase 1 implementation
**Next Steps:** React migration (Week 1 of implementation plan)
**Blockers:** None - ready to begin

Good luck! 🚀
