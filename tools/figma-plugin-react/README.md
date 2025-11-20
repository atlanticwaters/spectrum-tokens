# Spectrum Figma Plugin (React Version)

**Version 1.0.0** - React Migration Complete! 🎉

This is the next-generation version of the Adobe Spectrum Figma plugin, rebuilt with React for enhanced functionality and maintainability.

## Status: Phase 6 Complete - Production Ready ✅

**React migration is complete!** All 6 phases successfully delivered with comprehensive testing and documentation.

### Latest Release (v1.0.0)
- ✅ Full undo/redo support with keyboard shortcuts
- ✅ Virtual scrolling for large token lists
- ✅ Advanced performance optimizations with LRU caching
- ✅ Comprehensive user and API documentation
- ✅ 758 tests with 97.1% pass rate
- ✅ Production-ready build

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Build for development
pnpm build

# Watch mode (auto-rebuild)
pnpm watch

# Run tests
pnpm test

# Test with coverage
pnpm test:coverage
```

## Testing in Figma

1. Build the plugin: `pnpm build`
2. In Figma: **Plugins > Development > Import plugin from manifest**
3. Select: `tools/figma-plugin-react/manifest.json`
4. Test with a Figma file containing variable collections

---

## Features

### Core Functionality
- ✅ Token creation, editing, and deletion
- ✅ Import/export tokens in DTCG format
- ✅ Figma variable collection scanning
- ✅ Token type detection and validation
- ✅ Batch operations (add, update, delete)
- ✅ Find and replace with regex support
- ✅ Token duplication

### Storage Providers
- ✅ **GitHub** - Sync tokens with GitHub repositories
- ✅ **Local Storage** - Browser-based storage
- ✅ **URL Storage** - Read-only import from URLs

### User Experience
- ✅ **Undo/Redo** - Full history with Cmd+Z / Cmd+Shift+Z
- ✅ **Virtual Scrolling** - Smooth performance with 1000+ tokens
- ✅ **Toast Notifications** - Real-time feedback
- ✅ **Loading States** - Progress indicators
- ✅ **Keyboard Shortcuts** - Complete shortcut support
- ✅ **Accessibility** - ARIA labels and keyboard navigation

### Performance
- ✅ **LRU Caching** - Intelligent cache management
- ✅ **Memoization** - Optimized computations
- ✅ **Debouncing/Throttling** - Smooth interactions
- ✅ **Virtual Rendering** - Only render visible tokens

---

## Architecture

This plugin follows a **dual-thread architecture**:

- **Plugin Thread** (`src/plugin/code.ts`) - Runs in Figma sandbox, has Figma API access
- **UI Thread** (`src/ui/App.tsx`) - React app in iframe, has DOM access

Communication between threads uses `postMessage` API.

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **esbuild** - Fast bundler
- **Jest + RTL** - Testing framework

---

## Project Structure

```
tools/figma-plugin-react/
├── src/
│   ├── plugin/              # Plugin-side code (Figma sandbox)
│   │   └── code.ts          # Main plugin entry point
│   ├── ui/                  # UI-side code (React app)
│   │   ├── App.tsx          # React root component
│   │   ├── components/      # React components
│   │   │   ├── tokens/      # Token management
│   │   │   ├── storage/     # Storage providers
│   │   │   ├── toolbar/     # Toolbar components (History, etc.)
│   │   │   ├── feedback/    # Toasts, loading, errors
│   │   │   └── operations/  # Batch operations
│   │   ├── store/           # Redux store
│   │   │   ├── slices/      # Redux slices
│   │   │   └── middleware/  # Custom middleware
│   │   ├── hooks/           # Custom React hooks
│   │   └── operations/      # Business logic
│   ├── shared/              # Shared types and utilities
│   └── utils/               # Utility functions
├── test/                    # Test files
│   └── integration/         # Integration tests
├── dist/                    # Build output
├── USER_GUIDE.md            # User documentation
├── API_DOCUMENTATION.md     # API reference
├── CHANGELOG.md             # Version history
└── manifest.json            # Figma plugin manifest
```

---

## Documentation

### For Users
- **[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide
  - Installation instructions
  - Creating and editing tokens
  - Storage provider setup
  - Batch operations
  - Keyboard shortcuts
  - Troubleshooting

### For Developers
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API reference
  - Redux store structure
  - Actions and thunks
  - Plugin messages
  - Component APIs
  - Hooks and utilities

- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guide
  - Architecture overview
  - Development patterns
  - Best practices

- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
  - All changes by version
  - Migration guides

---

## Development Phases (All Complete)

### ✅ Phase 1: React Foundation (Week 1)
- React + TypeScript setup
- Redux Toolkit integration
- Component library foundation
- Testing infrastructure
- esbuild configuration

### ✅ Phase 2: Core UI Components (Week 1-2)
- TokenEditor with CRUD operations
- Button, Modal, Input components
- Form validation
- Component test suite

### ✅ Phase 3: Storage Integration (Week 2)
- Storage provider abstraction
- GitHub storage with OAuth
- Local and URL storage
- Sync operations (push/pull)

### ✅ Phase 4: Token Operations (Week 3)
- Find and Replace functionality
- Token browser with filtering
- Batch operations
- Node inspector

### ✅ Phase 5: Feedback Systems (Week 3)
- Toast notification system
- Loading overlay
- Error boundaries
- Status indicators

### ✅ Phase 6: Priority Features & Polish (Week 4)
- **Part 1 & 2:**
  - Redux integration complete
  - Batch operations
  - Toast system
  - Loading states
  - 102 new tests

- **Part 3 (Latest):**
  - Undo/Redo system (50 action history)
  - Virtual scrolling (1000+ tokens)
  - LRU caching and memoization
  - Performance optimizations
  - Complete documentation
  - 45 additional tests
  - Integration test suite

---

## Test Coverage

### Statistics
- **Total Tests:** 758 (up from 713)
- **Passing:** 736 (97.1%)
- **Phase 6 Tests:** 147 new tests
- **Coverage:** >90% for all new code

### Test Distribution
- Unit tests: 743
- Integration tests: 15
- Component tests: Multiple per component
- Store tests: All slices covered
- Utility tests: All functions covered

### Known Issues
- 22 pre-existing test failures (legacy Figma API mocking)
- Not introduced in Phase 6
- Documented in issue tracker

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Create new token |
| `Cmd/Ctrl + F` | Find and replace |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + S` | Save |
| `Esc` | Close modal |

See [USER_GUIDE.md](./USER_GUIDE.md) for complete shortcut reference.

---

## Performance Features

### Virtual Scrolling
- Automatically enabled for lists >50 tokens
- Handles 1000+ tokens smoothly
- Configurable buffer size
- Maintains scroll position

### Caching
- LRU cache for computed values
- Token filtering and sorting
- Search results
- Dependency analysis

### Optimizations
- Memoized expensive computations
- Debounced search
- Throttled scroll handlers
- React.memo for heavy components

---

## Contributing

We welcome contributions! Please see:
- [Contributing Guidelines](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)
- [Development Guide](./CLAUDE.md)

### Development Workflow

1. Clone repository
2. Install dependencies: `pnpm install`
3. Create feature branch: `git checkout -b feature/my-feature`
4. Make changes
5. Add tests
6. Run tests: `pnpm test`
7. Build: `pnpm build`
8. Commit with descriptive message
9. Push and create PR

---

## License

Apache-2.0 - See LICENSE file for details

Copyright 2024 Adobe. All rights reserved.

---

## Questions & Support

- **Issues:** https://github.com/adobe/spectrum-tokens/issues
- **Discussions:** https://github.com/adobe/spectrum-tokens/discussions
- **Documentation:** [USER_GUIDE.md](./USER_GUIDE.md) | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## Acknowledgments

- **Adobe Spectrum Team** - Product vision and requirements
- **Token Studio** - Architectural patterns and inspiration
- **Open Source Community** - Contributions and feedback
- **Claude Code** - Development assistance

---

**Built with ❤️ by Adobe Spectrum Team**
