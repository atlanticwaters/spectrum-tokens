# Developer Quick Start Guide

**For the Development Agent: How to Begin Implementation**

This guide provides a quick-start path for beginning the feature parity implementation. Follow these steps to get started immediately.

***

## Overview

You are implementing feature parity between:

* **Source:** Token Studio Plugin (`tools/figma-plugin-ts/`)
* **Target:** Adobe Spectrum Plugin (`tools/figma-plugin/`)

**Key Documents:**

1. `FEATURE_PARITY_PLAN.md` - Strategic overview and roadmap
2. `IMPLEMENTATION_CHECKLIST.md` - Detailed task list
3. This file - Quick start instructions

***

## Day 1: Setup & Planning

### Morning: Environment Setup (2 hours)

```bash
# Navigate to plugin directory
cd tools/figma-plugin

# Verify dependencies
node --version  # Should be 20+
pnpm --version  # Should be 10+

# Install dependencies
pnpm install

# Verify current plugin works
pnpm build
pnpm test

# Open in Figma to test
# Plugins > Development > Import plugin from manifest
# Select: tools/figma-plugin/manifest.json
```

### Afternoon: Code Review (4 hours)

**Review Current Implementation:**

1. Read `tools/figma-plugin/README.md`
2. Explore `src/` directory structure
3. Run tests: `pnpm test`
4. Test plugin in Figma with sample variables

**Review Token Studio Reference:**

1. Explore `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/`
2. Focus on key files:
   * `src/plugin/controller.ts` - Plugin architecture
   * `src/app/index.tsx` - UI entry point
   * `src/storage/` - Storage providers
   * `src/plugin/apply*ValuesOnNode.ts` - Token application

**Identify Patterns:**

* AsyncMessageChannel for plugin ↔ UI communication
* Redux for state management
* Storage provider abstraction
* Token application patterns

***

## Week 1: React Foundation

### Day 1-2: React Setup

**Install React:**

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

**Create Basic Structure:**

```
src/ui/
├── App.tsx                 # Root component
├── components/
│   ├── Button.tsx
│   ├── Checkbox.tsx
│   ├── Input.tsx
│   └── Modal.tsx
├── hooks/
│   └── usePluginMessage.ts
└── styles/
    └── global.css
```

**Update Build:**

```javascript
// build.js - Add React support
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/ui/ui.tsx'],  // Changed from .ts
  bundle: true,
  jsx: 'automatic',  // Add this
  jsxDev: true,      // For development
  outfile: 'dist/ui.js',
  // ... rest of config
});
```

**Create App.tsx:**

```typescript
import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div>
      <h1>Spectrum Token Exporter</h1>
      <p>React is working!</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

**Update ui.html:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    #root { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="ui.js"></script>
</body>
</html>
```

**Test:**

```bash
pnpm build
# Test in Figma - you should see "React is working!"
```

### Day 3-4: Component Library

**Create Components:**

```typescript
// src/ui/components/Button.tsx
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

```typescript
// src/ui/components/Checkbox.tsx
import React from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
```

**Write Tests:**

```typescript
// src/ui/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Day 5: State Management

**Option A: Redux Toolkit (Recommended)**

```bash
pnpm add @reduxjs/toolkit react-redux
```

```typescript
// src/ui/store/index.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CollectionSelection } from '../../shared/types';

interface AppState {
  collections: CollectionSelection[];
  isExporting: boolean;
  error: string | null;
}

const initialState: AppState = {
  collections: [],
  isExporting: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCollections(state, action: PayloadAction<CollectionSelection[]>) {
      state.collections = action.payload;
    },
    setExporting(state, action: PayloadAction<boolean>) {
      state.isExporting = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setCollections, setExporting, setError } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Wrap App with Provider:**

```typescript
// src/ui/App.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { MainView } from './components/MainView';

function App() {
  return (
    <Provider store={store}>
      <MainView />
    </Provider>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

**Use in Components:**

```typescript
// src/ui/components/MainView.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setCollections } from '../store';

export function MainView() {
  const collections = useSelector((state: RootState) => state.app.collections);
  const dispatch = useDispatch();

  React.useEffect(() => {
    // Request collections from plugin
    parent.postMessage({ pluginMessage: { type: 'scan-collections' } }, '*');
  }, []);

  return (
    <div>
      <h1>Collections: {collections.length}</h1>
    </div>
  );
}
```

***

## Week 2: Storage Providers

### Day 1: Storage Architecture

**Create Provider Interface:**

```typescript
// src/storage/IStorageProvider.ts
export interface TokenData {
  tokens: Record<string, any>;
  metadata?: {
    version: string;
    lastModified: string;
  };
}

export interface IStorageProvider {
  name: string;
  canRead: boolean;
  canWrite: boolean;

  read(): Promise<TokenData>;
  write(data: TokenData): Promise<void>;

  authenticate?(): Promise<void>;
  isAuthenticated?(): boolean;
}
```

**Create Base Class:**

```typescript
// src/storage/StorageProvider.ts
export abstract class StorageProvider implements IStorageProvider {
  abstract name: string;
  abstract canRead: boolean;
  abstract canWrite: boolean;

  abstract read(): Promise<TokenData>;
  abstract write(data: TokenData): Promise<void>;

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw new Error(`${this.name}: ${error.message}`);
    }
    throw new Error(`${this.name}: Unknown error`);
  }
}
```

### Day 2-4: GitHub Provider

**Install Dependencies:**

```bash
pnpm add @octokit/rest
```

**Implement Provider:**

```typescript
// src/storage/GithubStorage.ts
import { Octokit } from '@octokit/rest';
import { StorageProvider } from './StorageProvider';
import type { TokenData } from './IStorageProvider';

export interface GithubConfig {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
  token: string;
}

export class GithubStorage extends StorageProvider {
  name = 'GitHub';
  canRead = true;
  canWrite = true;

  private octokit: Octokit;
  private config: GithubConfig;

  constructor(config: GithubConfig) {
    super();
    this.config = config;
    this.octokit = new Octokit({ auth: config.token });
  }

  async read(): Promise<TokenData> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        ref: this.config.branch,
      });

      if (!('content' in data)) {
        throw new Error('Not a file');
      }

      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.handleError(error);
    }
  }

  async write(data: TokenData): Promise<void> {
    try {
      // Get current file SHA for update
      let sha: string | undefined;
      try {
        const { data: currentFile } = await this.octokit.repos.getContent({
          owner: this.config.owner,
          repo: this.config.repo,
          path: this.config.path,
          ref: this.config.branch,
        });
        if ('sha' in currentFile) {
          sha = currentFile.sha;
        }
      } catch {
        // File doesn't exist, that's ok
      }

      const content = JSON.stringify(data, null, 2);
      const contentBase64 = Buffer.from(content).toString('base64');

      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path: this.config.path,
        message: `Update tokens from Figma plugin`,
        content: contentBase64,
        branch: this.config.branch,
        sha,
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

**Create UI for GitHub Config:**

```typescript
// src/ui/components/GithubConfig.tsx
import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface GithubConfigProps {
  onSave: (config: {
    owner: string;
    repo: string;
    path: string;
    token: string;
  }) => void;
}

export function GithubConfig({ onSave }: GithubConfigProps) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [path, setPath] = useState('tokens.json');
  const [token, setToken] = useState('');

  const handleSubmit = () => {
    onSave({ owner, repo, path, token });
  };

  return (
    <div className="github-config">
      <h2>GitHub Configuration</h2>
      <Input label="Owner" value={owner} onChange={setOwner} />
      <Input label="Repository" value={repo} onChange={setRepo} />
      <Input label="File Path" value={path} onChange={setPath} />
      <Input label="Access Token" type="password" value={token} onChange={setToken} />
      <Button onClick={handleSubmit}>Connect</Button>
    </div>
  );
}
```

### Day 5: Local Storage Provider

**Implement:**

```typescript
// src/storage/LocalStorage.ts
import { StorageProvider } from './StorageProvider';
import type { TokenData } from './IStorageProvider';

export class LocalStorage extends StorageProvider {
  name = 'Local Storage';
  canRead = true;
  canWrite = true;

  private key = 'spectrum-tokens';

  async read(): Promise<TokenData> {
    const data = localStorage.getItem(this.key);
    if (!data) {
      throw new Error('No tokens found in local storage');
    }
    return JSON.parse(data);
  }

  async write(data: TokenData): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(data, null, 2));
  }
}
```

***

## Quick Reference: Key Patterns

### Plugin ↔ UI Communication

**From UI to Plugin:**

```typescript
// In UI component
parent.postMessage({
  pluginMessage: {
    type: 'export-tokens',
    payload: { selections, settings }
  }
}, '*');
```

**From Plugin to UI:**

```typescript
// In plugin code.ts
figma.ui.postMessage({
  type: 'collections-scanned',
  payload: { collections }
});
```

**Listen in UI:**

```typescript
// In UI
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg.type === 'collections-scanned') {
    dispatch(setCollections(msg.payload.collections));
  }
};
```

### Token Application Pattern

```typescript
// Apply color to node
async function applyColorToken(node: SceneNode, color: RGBA) {
  if ('fills' in node && node.fills !== figma.mixed) {
    node.fills = [{
      type: 'SOLID',
      color: { r: color.r, g: color.g, b: color.b },
      opacity: color.a ?? 1,
    }];
  }
}

// Apply typography to text node
async function applyTypographyToken(node: TextNode, typography: Typography) {
  // Load font first
  await figma.loadFontAsync({
    family: typography.fontFamily,
    style: typography.fontStyle || 'Regular',
  });

  node.fontName = {
    family: typography.fontFamily,
    style: typography.fontStyle || 'Regular',
  };
  node.fontSize = typography.fontSize;
  if (typography.lineHeight) {
    node.lineHeight = { value: typography.lineHeight, unit: 'PIXELS' };
  }
}
```

### Storage Provider Pattern

```typescript
// In plugin code
import { GithubStorage } from '../storage/GithubStorage';

const storage = new GithubStorage({
  owner: 'adobe',
  repo: 'spectrum-tokens',
  path: 'tokens/exported.json',
  token: 'ghp_xxxxx',
});

// Read tokens
const tokenData = await storage.read();

// Write tokens
await storage.write({ tokens: exportedTokens });
```

***

## Common Issues & Solutions

### Issue: React not rendering

**Solution:** Check `ui.html` has `<div id="root"></div>` and script is loaded after body

### Issue: Plugin can't communicate with UI

**Solution:** Verify `postMessage` uses `pluginMessage` key and correct origin

### Issue: Types not working

**Solution:** Run `pnpm install` to get `@figma/plugin-typings`

### Issue: Build fails

**Solution:** Clear dist folder: `rm -rf dist && pnpm build`

### Issue: Can't load fonts

**Solution:** Always use `figma.loadFontAsync()` before changing font properties

***

## Testing Strategy

### Unit Tests

```bash
pnpm test                    # Run all tests
pnpm test -- --watch        # Watch mode
pnpm test -- --coverage     # Coverage report
```

### Manual Testing in Figma

1. Create test file with variables
2. Import plugin from manifest
3. Test each feature systematically
4. Check Figma console for errors

### Integration Testing

* Test plugin ↔ UI communication
* Test storage provider reads/writes
* Test token application
* Test end-to-end workflows

***

## Daily Workflow

```bash
# Morning
git pull origin main
pnpm install  # If package.json changed

# Development
pnpm build --watch  # In one terminal
pnpm test --watch   # In another terminal

# Before commit
pnpm lint
pnpm test
pnpm build
git add .
git commit -m "feat: add feature X"
git push
```

***

## Next Steps

1. **Start with Phase 1:** React foundation
2. **Reference Token Studio:** Copy patterns, not code
3. **Test frequently:** Every feature should have tests
4. **Document as you go:** Update README and inline comments
5. **Ask questions:** Use IMPLEMENTATION\_CHECKLIST.md for guidance

***

## Resources

### Documentation

* [Figma Plugin API](https://www.figma.com/plugin-docs/)
* [React Docs](https://react.dev/)
* [Redux Toolkit](https://redux-toolkit.js.org/)
* [Design Tokens Spec](https://design-tokens.github.io/community-group/format/)

### Reference Code

* Token Studio Plugin: `tools/figma-plugin-ts/`
* Current Spectrum Plugin: `tools/figma-plugin/`

### Key Files

* `FEATURE_PARITY_PLAN.md` - Strategic plan
* `IMPLEMENTATION_CHECKLIST.md` - Task list
* `README.md` - Plugin overview

***

## Questions?

If you're stuck:

1. Check IMPLEMENTATION\_CHECKLIST.md for detailed steps
2. Review Token Studio reference implementation
3. Check Figma Plugin API docs
4. Ask project manager for clarification

Good luck with the implementation! 🚀
