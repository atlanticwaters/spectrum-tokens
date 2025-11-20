# Migration Notes: Token Studio Patterns → Spectrum Plugin

This document captures key patterns from Token Studio that should be adapted for the Spectrum plugin.

## Architecture Patterns to Adopt

### 1. AsyncMessageChannel Pattern

**Token Studio Implementation:**
`src/AsyncMessageChannel.ts` provides a robust message passing abstraction.

**Key Concept:**
Instead of raw `postMessage`, use a channel abstraction with typed handlers.

**Token Studio Example:**

```typescript
// In controller.ts
AsyncMessageChannel.PluginInstance.handle(
  AsyncMessageTypes.PULL_STYLES,
  asyncHandlers.pullStyles
);

// Handler
export async function pullStyles(msg) {
  // Implementation
  return result;
}
```

**Adapt for Spectrum:**

```typescript
// src/plugin/MessageChannel.ts
type MessageHandler<T = any> = (payload: T) => Promise<any> | any;

class MessageChannel {
  private handlers = new Map<string, MessageHandler>();

  handle(type: string, handler: MessageHandler) {
    this.handlers.set(type, handler);
  }

  async dispatch(msg: { type: string; payload?: any }) {
    const handler = this.handlers.get(msg.type);
    if (handler) {
      return await handler(msg.payload);
    }
  }
}

export const pluginChannel = new MessageChannel();

// Usage in code.ts
pluginChannel.handle('scan-collections', async () => {
  return await scanCollections();
});
```

**Benefits:**

* Type-safe message handling
* Centralized handler registration
* Easier to test
* Better error handling

***

### 2. Storage Provider Abstraction

**Token Studio Pattern:**
Each storage provider extends a base class and implements common interface.

**Token Studio File:** `src/storage/GithubTokenStorage.ts`

**Key Pattern:**

```typescript
export abstract class RemoteTokenStorage {
  abstract read(): Promise<any>;
  abstract write(data: any): Promise<void>;

  protected handleError(error: unknown): never {
    // Common error handling
    throw error;
  }
}

export class GithubTokenStorage extends RemoteTokenStorage {
  private octokit: Octokit;

  async read() {
    try {
      const { data } = await this.octokit.repos.getContent({...});
      return JSON.parse(Buffer.from(data.content, 'base64').toString());
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

**Adapt for Spectrum:**

* Use same pattern but simpler base class
* Keep Adobe Spectrum token format specifics
* Add validation for DTCG format

***

### 3. Token Application Pattern

**Token Studio Pattern:**
Separate files for each token type application.

**Token Studio Files:**

* `src/plugin/applyColorTokenOnNode.ts`
* `src/plugin/applyTypographyTokenOnNode.ts`
* `src/plugin/applySizingValuesOnNode.ts`
* etc.

**Key Pattern:**

```typescript
// Token Studio's applyColorTokenOnNode.ts
export async function applyColorTokenOnNode(
  node: SceneNode,
  data: NodeTokenRefMap,
  values: SingleToken['value']
) {
  if ('fills' in node && node.fills !== figma.mixed) {
    const { color, opacity } = parseColor(values);
    node.fills = [{
      type: 'SOLID',
      color,
      opacity
    }];
  }
}
```

**Adapt for Spectrum:**

```typescript
// src/plugin/tokenApplication/applyColor.ts
export async function applyColorToken(
  node: SceneNode,
  tokenValue: string
): Promise<void> {
  // Validate node type
  if (!('fills' in node)) {
    throw new Error('Node does not support fills');
  }

  if (node.fills === figma.mixed) {
    console.warn('Node has mixed fills, skipping');
    return;
  }

  // Parse color from DTCG format
  const rgba = parseColorValue(tokenValue);

  // Apply to node
  node.fills = [{
    type: 'SOLID',
    color: { r: rgba.r, g: rgba.g, b: rgba.b },
    opacity: rgba.a ?? 1
  }];
}
```

**Benefits:**

* Modular, testable functions
* Type-specific logic isolated
* Easy to add new token types
* Consistent error handling

***

### 4. Redux Store Structure

**Token Studio Pattern:**
Uses Rematch (Redux wrapper) with domain-based models.

**Token Studio File:** `src/app/store.ts`

**Token Studio Example:**

```typescript
// Using Rematch
export const uiState = {
  state: {
    selectedTab: 'tokens',
    isLoading: false,
    error: null
  },
  reducers: {
    setSelectedTab(state, tab) {
      return { ...state, selectedTab: tab };
    }
  }
};
```

**Adapt for Spectrum (Redux Toolkit):**

```typescript
// src/ui/store/slices/uiSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    selectedTab: 'export',
    isLoading: false,
    error: null
  },
  reducers: {
    setSelectedTab(state, action) {
      state.selectedTab = action.payload; // Redux Toolkit uses Immer
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const { setSelectedTab, setLoading, setError } = uiSlice.actions;
export default uiSlice.reducer;
```

**Benefits:**

* Redux Toolkit is simpler than Rematch
* Built-in Immer for immutability
* Better TypeScript support
* Standard Redux pattern

***

### 5. Component Structure

**Token Studio Pattern:**
Components organized by feature/domain.

**Token Studio Structure:**

```
src/app/components/
├── Button/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── index.ts
├── TokenList/
│   ├── TokenList.tsx
│   ├── TokenListItem.tsx
│   └── index.ts
```

**Adopt for Spectrum:**

```
src/ui/components/
├── common/           # Shared components
│   ├── Button/
│   ├── Input/
│   └── Modal/
├── collections/      # Collection-related components
│   ├── CollectionList/
│   ├── CollectionItem/
│   └── ModeSelector/
├── export/          # Export-related components
│   ├── ExportButton/
│   └── ExportProgress/
└── storage/         # Storage-related components
    ├── StorageConfig/
    └── SyncStatus/
```

***

### 6. Error Handling Pattern

**Token Studio Pattern:**
Centralized error handling with user-friendly messages.

**Token Studio Example:**

```typescript
try {
  await operation();
} catch (error) {
  // Send to UI
  AsyncMessageChannel.ReactInstance.message({
    type: AsyncMessageTypes.NOTIFY,
    payload: {
      text: 'Failed to load tokens',
      error: error.message
    }
  });

  // Log for debugging
  console.error('Operation failed:', error);
}
```

**Adapt for Spectrum:**

```typescript
// src/utils/errorHandler.ts
export class PluginError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof PluginError) {
    // Show user-friendly message
    figma.ui.postMessage({
      type: 'error',
      payload: {
        message: error.userMessage,
        recoverable: error.recoverable
      }
    });
  } else {
    // Unknown error
    figma.ui.postMessage({
      type: 'error',
      payload: {
        message: 'An unexpected error occurred',
        recoverable: true
      }
    });
  }

  // Always log for debugging
  console.error('Error:', error);
}

// Usage
try {
  const data = await storage.read();
} catch (error) {
  handleError(new PluginError(
    `Failed to read from ${storage.name}`,
    'Could not load tokens. Please check your connection.',
    true
  ));
}
```

***

### 7. Progress Tracking Pattern

**Token Studio Pattern:**
Uses a Worker class to schedule operations with progress callbacks.

**Token Studio File:** `src/plugin/Worker.ts`

**Key Concept:**

```typescript
defaultWorker.schedule(async (progress) => {
  progress.update(0.1, 'Starting...');
  await step1();

  progress.update(0.5, 'Processing...');
  await step2();

  progress.update(1.0, 'Complete');
});
```

**Adapt for Spectrum:**

```typescript
// src/plugin/ProgressTracker.ts
export class ProgressTracker {
  constructor(
    private total: number,
    private onUpdate: (current: number, message: string) => void
  ) {}

  update(current: number, message: string) {
    this.onUpdate(current, message);

    figma.ui.postMessage({
      type: 'progress',
      payload: { current, total: this.total, message }
    });
  }
}

// Usage
const tracker = new ProgressTracker(totalTokens, (current, msg) => {
  console.log(`Progress: ${current}/${totalTokens} - ${msg}`);
});

for (let i = 0; i < tokens.length; i++) {
  await processToken(tokens[i]);
  tracker.update(i + 1, `Processing ${tokens[i].name}`);
}
```

***

### 8. Figma Storage Persistence

**Token Studio Pattern:**
Persist plugin state to Figma's clientStorage.

**Token Studio File:** `src/figmaStorage/`

**Key Pattern:**

```typescript
// Save
await figma.clientStorage.setAsync('settings', {
  theme: 'dark',
  lastSync: Date.now()
});

// Load
const settings = await figma.clientStorage.getAsync('settings');
```

**Adapt for Spectrum:**

```typescript
// src/plugin/storage/PluginStorage.ts
export class PluginStorage {
  private static readonly KEYS = {
    SETTINGS: 'spectrum-settings',
    STORAGE_CONFIG: 'spectrum-storage-config',
    LAST_EXPORT: 'spectrum-last-export'
  };

  async saveSettings(settings: ExportSettings): Promise<void> {
    await figma.clientStorage.setAsync(
      PluginStorage.KEYS.SETTINGS,
      settings
    );
  }

  async loadSettings(): Promise<ExportSettings | null> {
    return await figma.clientStorage.getAsync(
      PluginStorage.KEYS.SETTINGS
    );
  }
}
```

***

## Key Differences to Maintain

### 1. Build System

* **Token Studio:** Webpack (complex config)
* **Spectrum:** esbuild (keep it - faster and simpler)

### 2. State Management

* **Token Studio:** Rematch (Redux wrapper)
* **Spectrum:** Redux Toolkit (more standard, better docs)

### 3. Dependencies

* **Token Studio:** 40+ npm packages
* **Spectrum:** Keep <20 packages (stay lean)

### 4. Token Format

* **Token Studio:** Multiple formats supported
* **Spectrum:** Focus on DTCG + Adobe Spectrum extensions

### 5. Features

* **Token Studio:** Everything including kitchen sink
* **Spectrum:** Focused on Adobe ecosystem needs

***

## Migration Checklist

### From Token Studio, Adopt:

* [x] Dual-thread architecture pattern
* [ ] AsyncMessageChannel pattern (simplified)
* [ ] Storage provider abstraction
* [ ] Token application modularity
* [ ] Redux store structure (Redux Toolkit)
* [ ] Component organization
* [ ] Error handling pattern
* [ ] Progress tracking pattern
* [ ] Figma storage persistence

### From Token Studio, Adapt:

* [ ] Webpack → esbuild
* [ ] Rematch → Redux Toolkit
* [ ] Feature flags → Simple config
* [ ] i18n → English only (initially)
* [ ] Analytics → Optional/minimal

### From Token Studio, Skip:

* [ ] LaunchDarkly feature flags
* [ ] Sentry error tracking (initially)
* [ ] Mixpanel analytics (initially)
* [ ] Storybook (optional)
* [ ] Cypress E2E tests (use Jest initially)

***

## Quick Reference: Where to Look

### For Storage Providers:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/storage/`

### For Token Application:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/plugin/apply*ValuesOnNode.ts`

### For Message Passing:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/AsyncMessageChannel.ts`
→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/plugin/controller.ts`

### For State Management:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/app/store.ts`
→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/selectors/`

### For React Components:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/src/app/components/`

### For Build Configuration:

→ `tools/figma-plugin-ts/packages/tokens-studio-for-figma/webpack.config.js` (understand, but use esbuild)

***

## Next Steps

1. **Review Token Studio code** for patterns
2. **Start with Phase 1** (React migration)
3. **Reference this doc** when implementing features
4. **Adapt, don't copy** - keep Spectrum plugin lean and focused
5. **Test frequently** - ensure each pattern works in our context

***

*This is a living document. Update as you discover new patterns or insights during implementation.*
