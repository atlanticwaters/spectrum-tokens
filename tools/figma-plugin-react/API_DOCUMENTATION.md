# Adobe Spectrum Figma Plugin - API Documentation

**Version:** 1.0.0 (React Migration - Phase 6 Complete)
**Last Updated:** 2025-01-19

---

## Table of Contents

1. [Redux Store Structure](#redux-store-structure)
2. [Redux Actions & Thunks](#redux-actions--thunks)
3. [Plugin Message Types](#plugin-message-types)
4. [Storage Provider Interface](#storage-provider-interface)
5. [Token Type Definitions](#token-type-definitions)
6. [Validation Functions](#validation-functions)
7. [Utility Functions](#utility-functions)
8. [React Hooks](#react-hooks)
9. [Components API](#components-api)

---

## Redux Store Structure

### Root State

```typescript
interface RootState {
  ui: UIState;
  collections: CollectionsState;
  settings: SettingsState;
  storage: StorageState;
  themes: ThemesState;
  tokens: TokensState;
  toasts: ToastsState;
  history: HistoryState;
}
```

### UI Slice

```typescript
interface UIState {
  isLoading: boolean;
  error: string | null;
  activeView: 'tokens' | 'collections' | 'settings';
  sidebarOpen: boolean;
}

// Actions
setLoading(isLoading: boolean): void
setError(error: string | null): void
setActiveView(view: string): void
toggleSidebar(): void
clearError(): void
```

### Tokens Slice

```typescript
interface TokensState {
  tokens: Token[];
  selectedToken: Token | null;
  editingToken: Token | null;
  isLoading: boolean;
  error: string | null;
}

// Actions
addToken(token: Token): void
updateToken({ name: string, updates: Partial<Token> }): void
deleteToken(tokenName: string): void
selectToken(token: Token | null): void
setEditingToken(token: Token | null): void
loadTokens(tokens: Token[]): void
setTokens(tokens: Token[]): void
clearTokens(): void
setLoading(isLoading: boolean): void
setError(error: string | null): void
clearError(): void

// Async Thunks
batchAddTokens(tokens: Token[]): AsyncThunk
batchUpdateTokens(updates: TokenUpdate[]): AsyncThunk
batchDeleteTokens(tokenNames: string[]): AsyncThunk
duplicateTokens(tokenNames: string[]): AsyncThunk
```

### History Slice

```typescript
interface HistoryState {
  past: TokensState[];
  present: TokensState | null;
  future: TokensState[];
  canUndo: boolean;
  canRedo: boolean;
  maxHistorySize: number;
  lastActionDescription: string | null;
}

// Actions
recordAction({ state: TokensState, description: string }): void
undo(): void
redo(): void
clearHistory(): void
initializeHistory(state: TokensState): void
setMaxHistorySize(size: number): void

// Selectors
selectCanUndo(state: RootState): boolean
selectCanRedo(state: RootState): boolean
selectPresentState(state: RootState): TokensState | null
selectLastActionDescription(state: RootState): string | null
selectHistorySize(state: RootState): { past: number; future: number }
```

### Toasts Slice

```typescript
interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface ToastsState {
  toasts: Toast[];
}

// Actions
addToast({ message, type, duration }): void
removeToast(id: string): void
clearToasts(): void
```

### Storage Slice

```typescript
interface StorageState {
  type: 'github' | 'local' | 'url' | null;
  config: Record<string, any>;
  isConnected: boolean;
  lastSync: string | null;
}

// Actions
setStorageType(type: string): void
setStorageConfig(config: object): void
setConnected(isConnected: boolean): void
setLastSync(timestamp: string): void
```

---

## Redux Actions & Thunks

### Token Operations

#### Add Token

```typescript
import { addToken } from './store/slices/tokensSlice';

dispatch(addToken({
  name: 'color-primary',
  value: '#1976d2',
  type: 'color',
  description: 'Primary brand color'
}));
```

#### Update Token

```typescript
import { updateToken } from './store/slices/tokensSlice';

dispatch(updateToken({
  name: 'color-primary',
  updates: {
    value: '#2196f3',
    description: 'Updated primary color'
  }
}));
```

#### Delete Token

```typescript
import { deleteToken } from './store/slices/tokensSlice';

dispatch(deleteToken('color-primary'));
```

#### Batch Operations

```typescript
import { batchAddTokens, batchUpdateTokens, batchDeleteTokens } from './operations/batchOperations';

// Add multiple tokens
dispatch(batchAddTokens([
  { name: 'token1', value: '#000', type: 'color' },
  { name: 'token2', value: '#fff', type: 'color' }
]));

// Update multiple tokens
dispatch(batchUpdateTokens([
  { id: 'token1', changes: { value: '#111' } },
  { id: 'token2', changes: { value: '#eee' } }
]));

// Delete multiple tokens
dispatch(batchDeleteTokens(['token1', 'token2']));
```

### History Operations

```typescript
import { undo, redo, clearHistory } from './store/slices/historySlice';

// Undo last action
dispatch(undo());

// Redo last undone action
dispatch(redo());

// Clear all history
dispatch(clearHistory());
```

### Toast Notifications

```typescript
import { addToast } from './store/slices/toastsSlice';

// Show success toast
dispatch(addToast({
  message: 'Token saved successfully',
  type: 'success',
  duration: 3000 // Optional, defaults to 5000ms
}));

// Show error toast
dispatch(addToast({
  message: 'Failed to save token',
  type: 'error'
}));
```

---

## Plugin Message Types

### Plugin → UI Messages

```typescript
type PluginResponse =
  | { type: 'collections-scanned'; payload: { collections: Collection[] } }
  | { type: 'export-progress'; payload: { current: number; total: number } }
  | { type: 'export-complete'; payload: { files: FileData[] } }
  | { type: 'export-error'; payload: { error: string } }
  | { type: 'node-selected'; payload: { nodeId: string; nodeType: string } };
```

### UI → Plugin Messages

```typescript
type PluginMessage =
  | { type: 'scan-collections' }
  | { type: 'export-tokens'; payload: { selections: string[]; settings: ExportSettings } }
  | { type: 'apply-token'; payload: { nodeId: string; token: Token } }
  | { type: 'close-plugin' };
```

### Sending Messages

```typescript
// From UI to Plugin
parent.postMessage({
  pluginMessage: {
    type: 'scan-collections'
  }
}, '*');

// From Plugin to UI
figma.ui.postMessage({
  type: 'collections-scanned',
  payload: { collections: [...] }
});
```

---

## Storage Provider Interface

### Base Interface

```typescript
interface IStorageProvider {
  /** Provider name */
  name: string;

  /** Can read tokens */
  canRead: boolean;

  /** Can write tokens */
  canWrite: boolean;

  /** Read tokens from storage */
  read(): Promise<TokenData>;

  /** Write tokens to storage */
  write(data: TokenData): Promise<void>;

  /** Authenticate with provider (optional) */
  authenticate?(): Promise<void>;

  /** Check if authenticated */
  isAuthenticated?(): boolean;
}
```

### GitHub Storage Provider

```typescript
class GithubStorage implements IStorageProvider {
  name = 'github';
  canRead = true;
  canWrite = true;

  constructor(config: GithubConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.branch = config.branch;
    this.path = config.path;
    this.token = config.token;
  }

  async read(): Promise<TokenData> {
    const response = await fetch(
      `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.path}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3.raw'
        }
      }
    );
    return response.json();
  }

  async write(data: TokenData): Promise<void> {
    // Implementation...
  }
}
```

### Creating a Custom Provider

```typescript
class MyCustomStorage implements IStorageProvider {
  name = 'custom';
  canRead = true;
  canWrite = true;

  async read(): Promise<TokenData> {
    // Fetch from your API
    const response = await fetch('https://api.example.com/tokens');
    return response.json();
  }

  async write(data: TokenData): Promise<void> {
    // Save to your API
    await fetch('https://api.example.com/tokens', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

---

## Token Type Definitions

### Token Interface

```typescript
interface Token {
  /** Unique token name */
  name: string;

  /** Token value (any type) */
  value: any;

  /** Token type (color, dimension, etc.) */
  type: string;

  /** Human-readable description */
  description?: string;

  /** Associated Figma style ID */
  styleId?: string;

  /** Associated Figma variable ID */
  variableId?: string;

  /** Collection ID */
  collectionId?: string;
}
```

### Supported Token Types

```typescript
type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'string';
```

### Token Value Types

```typescript
// Color tokens
type ColorValue = string; // '#rrggbb', 'rgb(r,g,b)', 'hsl(h,s,l)'

// Dimension tokens
type DimensionValue = string; // '16px', '1rem', '0.5em'

// Font tokens
type FontFamilyValue = string | string[]; // 'Inter' or ['Inter', 'sans-serif']
type FontWeightValue = number | string; // 400 or 'regular'

// Animation tokens
type DurationValue = string; // '200ms', '0.2s'
type CubicBezierValue = [number, number, number, number]; // [0.4, 0, 0.2, 1]
```

---

## Validation Functions

### Token Validation

```typescript
import { validateToken } from './utils/validators';

const isValid = validateToken({
  name: 'color-primary',
  value: '#1976d2',
  type: 'color'
});

if (!isValid) {
  console.error('Token validation failed');
}
```

### Color Validation

```typescript
import { isValidColor } from './utils/validators';

isValidColor('#1976d2'); // true
isValidColor('rgb(25, 118, 210)'); // true
isValidColor('invalid'); // false
```

### Name Validation

```typescript
import { isValidTokenName } from './utils/validators';

isValidTokenName('color-primary'); // true
isValidTokenName('color_primary'); // true
isValidTokenName('123-invalid'); // false (starts with number)
isValidTokenName('invalid space'); // false (contains space)
```

---

## Utility Functions

### Memoization

```typescript
import { memoize, LRUCache } from './utils/memoization';

// Memoize expensive function
const expensiveCalc = memoize((a: number, b: number) => {
  // Heavy computation
  return a * b;
}, 100); // Cache size: 100

const result = expensiveCalc(5, 10); // Computed
const cached = expensiveCalc(5, 10); // From cache
```

### LRU Cache

```typescript
import { LRUCache } from './utils/memoization';

const cache = new LRUCache<string, number>(50);

cache.set('key1', 100);
cache.set('key2', 200);

const value = cache.get('key1'); // 100
const exists = cache.has('key2'); // true

cache.clear(); // Clear all entries
```

### Debounce/Throttle

```typescript
import { debounce, throttle } from './utils/memoization';

// Debounce function
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// Throttle function
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

---

## React Hooks

### useAppDispatch & useAppSelector

```typescript
import { useAppDispatch, useAppSelector } from './store/hooks';

function MyComponent() {
  const dispatch = useAppDispatch();
  const tokens = useAppSelector(state => state.tokens.tokens);

  const handleAdd = () => {
    dispatch(addToken({...}));
  };

  return <div>{tokens.length} tokens</div>;
}
```

### useHistory

```typescript
import { useHistory } from './hooks/useHistory';

function MyComponent() {
  const { handleUndo, handleRedo, canUndo, canRedo } = useHistory();

  return (
    <div>
      <button onClick={handleUndo} disabled={!canUndo}>Undo</button>
      <button onClick={handleRedo} disabled={!canRedo}>Redo</button>
    </div>
  );
}
```

### useTokenCache

```typescript
import { useTokenCache } from './hooks/useTokenCache();

function TokenList({ tokens }) {
  const { getFilteredTokens, getSortedTokens, searchTokens } = useTokenCache();

  const filtered = getFilteredTokens(tokens, { type: 'color' });
  const sorted = getSortedTokens(filtered, { field: 'name', direction: 'asc' });
  const results = searchTokens(tokens, 'primary');

  return <div>...</div>;
}
```

### useKeyboardShortcuts

```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcuts({
    'cmd+n': () => createNewToken(),
    'cmd+f': () => openSearch(),
    'cmd+z': () => undo(),
    'escape': () => closeModal(),
  });

  return <div>Press Cmd+N to create a new token</div>;
}
```

---

## Components API

### VirtualTokenList

```typescript
import { VirtualTokenList } from './components/tokens/VirtualTokenList';

<VirtualTokenList
  tokens={tokens}
  itemHeight={60}
  viewportHeight={400}
  bufferSize={5}
  onTokenClick={(token) => handleClick(token)}
  onTokenDelete={(tokenId) => handleDelete(tokenId)}
  renderToken={(token, index) => (
    <CustomTokenItem token={token} index={index} />
  )}
/>
```

### HistoryButtons

```typescript
import { HistoryButtons } from './components/toolbar/HistoryButtons';

<HistoryButtons
  className="my-history-buttons"
  showShortcutHints={true}
/>
```

### ToastContainer

```typescript
import { ToastContainer } from './components/feedback/ToastContainer';

// Place once in your app
<ToastContainer />

// Trigger toasts via Redux
dispatch(showToast({ message: 'Success!', type: 'success' }));
```

---

## Examples

### Complete Token CRUD Workflow

```typescript
import { useAppDispatch } from './store/hooks';
import { addToken, updateToken, deleteToken } from './store/slices/tokensSlice';
import { addToast } from './store/slices/toastsSlice';

function TokenManager() {
  const dispatch = useAppDispatch();

  const handleCreate = async () => {
    const token = {
      name: 'color-primary',
      value: '#1976d2',
      type: 'color',
      description: 'Primary brand color'
    };

    dispatch(addToken(token));
    dispatch(addToast({
      message: 'Token created successfully',
      type: 'success'
    }));
  };

  const handleUpdate = async () => {
    dispatch(updateToken({
      name: 'color-primary',
      updates: { value: '#2196f3' }
    }));
    dispatch(addToast({
      message: 'Token updated',
      type: 'success'
    }));
  };

  const handleDelete = async () => {
    dispatch(deleteToken('color-primary'));
    dispatch(addToast({
      message: 'Token deleted',
      type: 'info'
    }));
  };

  return (
    <div>
      <button onClick={handleCreate}>Create</button>
      <button onClick={handleUpdate}>Update</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

---

## TypeScript Types Export

All types are exported from their respective files:

```typescript
// Token types
import type { Token, TokenType } from './components/tokens/types';

// Storage types
import type { IStorageProvider, GithubConfig } from './storage/types';

// Redux types
import type { RootState, AppDispatch } from './store';

// Message types
import type { PluginMessage, PluginResponse } from './shared/types';
```

---

## License

Copyright 2024 Adobe. Licensed under the Apache License, Version 2.0.
