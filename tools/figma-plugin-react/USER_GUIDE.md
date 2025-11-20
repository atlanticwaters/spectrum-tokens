# Adobe Spectrum Figma Plugin - User Guide

**Version:** 1.0.0 (React Migration Complete - Phase 6)
**Last Updated:** 2025-01-19

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installing the Plugin](#installing-the-plugin)
3. [Creating and Editing Tokens](#creating-and-editing-tokens)
4. [Storage Providers](#storage-providers)
5. [Batch Operations](#batch-operations)
6. [Keyboard Shortcuts](#keyboard-shortcuts-reference)
7. [Undo/Redo](#undoredo-functionality)
8. [Virtual Scrolling](#performance-features)
9. [Troubleshooting](#troubleshooting-common-issues)
10. [FAQ](#faq)

---

## Getting Started

The Adobe Spectrum Figma Plugin allows you to export, manage, and synchronize design tokens from Figma to Adobe Spectrum's token format. This plugin provides a powerful interface for managing design tokens at scale.

### Prerequisites

- Figma Desktop App or Figma in Browser
- (Optional) GitHub account for token synchronization
- (Optional) Node.js and pnpm for development

### Quick Start

1. Install the plugin (see [Installing the Plugin](#installing-the-plugin))
2. Open the plugin in any Figma file
3. Configure your storage provider (GitHub, Local, or URL)
4. Start creating and managing tokens!

---

## Installing the Plugin

### Method 1: From Figma Community (Recommended)

1. Open Figma
2. Go to **Plugins > Browse plugins in Community**
3. Search for "Adobe Spectrum Token Manager"
4. Click **Install**
5. The plugin will now appear in your **Plugins** menu

### Method 2: Development Installation

For developers or testing the latest features:

1. Clone the repository:
   ```bash
   git clone https://github.com/adobe/spectrum-tokens.git
   cd spectrum-tokens/tools/figma-plugin-react
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build the plugin:
   ```bash
   pnpm build
   ```

4. In Figma:
   - Go to **Plugins > Development > Import plugin from manifest**
   - Navigate to `tools/figma-plugin-react` and select `manifest.json`
   - The plugin is now installed in development mode

### Verifying Installation

1. Open any Figma file
2. Go to **Plugins > Development > Spectrum Token Manager (React)**
3. The plugin UI should open successfully

---

## Creating and Editing Tokens

### Creating a New Token

#### Method 1: Using the Create Button

1. Open the plugin
2. Click **Create Token** button
3. Fill in the token details:
   - **Name:** Unique identifier (e.g., `color-primary`)
   - **Value:** Token value (e.g., `#1976d2`)
   - **Type:** Token type (color, dimension, font, etc.)
   - **Description:** (Optional) Human-readable description
4. Click **Save**

#### Method 2: Using Keyboard Shortcut

- Press `Cmd+N` (Mac) or `Ctrl+N` (Windows)
- Token editor modal opens
- Fill in details and save

### Editing an Existing Token

1. Find the token in the token list
2. Click on the token name
3. Modify the values in the editor
4. Click **Save** or press `Cmd+S` (Mac) / `Ctrl+S` (Windows)

### Deleting a Token

1. Find the token in the token list
2. Click the **Delete** button next to the token
3. Confirm deletion in the dialog

**Warning:** Deleting a token that is referenced by other tokens may break those references.

### Token Types

The plugin supports these token types:

- **color** - Color values (hex, rgb, hsl)
- **dimension** - Size values (px, rem, em)
- **fontFamily** - Font family names
- **fontWeight** - Font weights (100-900)
- **duration** - Animation durations (ms, s)
- **cubicBezier** - Easing functions
- **number** - Raw numeric values
- **string** - Text values

---

## Storage Providers

Storage providers allow you to save and synchronize tokens with external services.

### GitHub Storage

Store tokens in a GitHub repository for team collaboration and version control.

#### Setup

1. Click **Storage** dropdown
2. Select **GitHub**
3. Click **Configure**
4. Enter GitHub configuration:
   - **Repository Owner:** GitHub username or organization
   - **Repository Name:** Repository name
   - **Branch:** Branch to use (default: `main`)
   - **Path:** Path to token file (e.g., `tokens/spectrum.json`)
   - **Access Token:** GitHub Personal Access Token

#### Creating a GitHub Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a descriptive name: "Figma Plugin Token"
4. Select scopes:
   - ✓ `repo` (Full control of private repositories)
5. Click **Generate token**
6. Copy the token immediately (you won't see it again)
7. Paste into the plugin's token field

#### Pull from GitHub

1. Configure GitHub storage (see above)
2. Click **Pull** button
3. Tokens from GitHub will overwrite local tokens
4. Review changes before proceeding

#### Push to GitHub

1. Make changes to tokens locally
2. Click **Push** button
3. Tokens will be committed to the configured branch
4. Commit message: "Update tokens from Figma Plugin"

### Local Storage

Store tokens in browser's local storage for quick access without external dependencies.

#### Setup

1. Select **Local** from storage dropdown
2. Tokens are automatically saved to browser storage
3. No additional configuration needed

**Note:** Local storage is per-browser. Tokens won't sync across devices.

### URL Storage (Read-Only)

Load tokens from a public URL for read-only access.

#### Setup

1. Select **URL** from storage dropdown
2. Enter the full URL to the JSON token file
3. Click **Load**
4. Tokens are loaded (read-only mode)

**Use Cases:**
- Loading design tokens from a CDN
- Importing tokens from a public repository
- Sharing token sets via URL

---

## Batch Operations

Batch operations allow you to perform actions on multiple tokens simultaneously.

### Find and Replace

Search and replace values across all tokens.

#### Usage

1. Press `Cmd+F` (Mac) or `Ctrl+F` (Windows)
2. Enter **Find** value (supports regex)
3. Enter **Replace** value
4. Select options:
   - **Match case:** Case-sensitive matching
   - **Match whole word:** Only match complete words
   - **Use regex:** Enable regular expressions
5. Preview changes
6. Click **Replace All** or **Replace Selected**

#### Examples

**Replace all hex colors with color references:**
- Find: `#([0-9A-Fa-f]{6})`
- Replace: `{color-$1}`
- Use regex: ✓

**Update all spacing values:**
- Find: `8px`
- Replace: `0.5rem`

### Batch Add Tokens

Add multiple tokens at once from JSON or CSV.

1. Click **Batch Operations > Add Tokens**
2. Paste JSON array or CSV data
3. Map columns to token fields
4. Preview and confirm
5. Click **Add Tokens**

### Batch Update Tokens

Update multiple tokens based on criteria.

1. Select tokens to update
2. Click **Batch Operations > Update**
3. Choose field to update
4. Enter new value or transformation
5. Apply changes

### Batch Delete Tokens

Delete multiple tokens at once.

1. Select tokens using checkboxes
2. Click **Batch Operations > Delete**
3. Confirm deletion
4. Tokens are removed (with undo support)

---

## Keyboard Shortcuts Reference

### General

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | Create new token |
| `Cmd/Ctrl + F` | Find and replace |
| `Cmd/Ctrl + S` | Save current token |
| `Esc` | Close modal/dialog |

### Undo/Redo

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Z` | Undo last action |
| `Cmd/Ctrl + Shift + Z` | Redo last undone action |

### Navigation

| Shortcut | Action |
|----------|--------|
| `↑/↓` | Navigate token list |
| `Enter` | Edit selected token |
| `Delete/Backspace` | Delete selected token |

### Selection

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + A` | Select all tokens |
| `Cmd/Ctrl + Click` | Multi-select tokens |
| `Shift + Click` | Range select tokens |

---

## Undo/Redo Functionality

The plugin includes comprehensive undo/redo support for all token operations.

### What Can Be Undone

- Adding new tokens
- Editing token values
- Deleting tokens
- Batch operations
- Find and replace operations

### Using Undo/Redo

#### Via Buttons

- Click **Undo** button (↶) in the toolbar
- Click **Redo** button (↷) in the toolbar
- Buttons show the number of available undo/redo actions

#### Via Keyboard

- `Cmd+Z` (Mac) or `Ctrl+Z` (Windows): Undo
- `Cmd+Shift+Z` (Mac) or `Ctrl+Shift+Z` (Windows): Redo

### History Limits

- Last **50 actions** are kept in history
- Older actions are automatically removed
- Creating a new action after undo clears redo history

### Toast Notifications

When you undo or redo:
- A toast notification appears: "Undone" or "Redone"
- Shows for 2 seconds
- Confirms the operation succeeded

---

## Performance Features

### Virtual Scrolling

For large token lists (>50 tokens), the plugin automatically uses virtual scrolling to maintain performance.

#### How It Works

- Only visible tokens are rendered
- Smooth scrolling even with thousands of tokens
- Minimal memory usage
- Maintains scroll position on updates

#### Configuration

Virtual scrolling is automatic but can be customized:

```typescript
// In TokenBrowser component
useShouldVirtualize(tokens.length, 50); // Threshold: 50 tokens
```

### Caching

The plugin caches computed values for better performance:

- **Filtered tokens:** Results of filter operations
- **Sorted tokens:** Results of sort operations
- **Search results:** Token search queries
- **Dependencies:** Token dependency graphs

Caches are automatically invalidated when tokens change.

---

## Troubleshooting Common Issues

### Plugin Won't Load

**Symptoms:** Plugin doesn't appear or shows blank screen

**Solutions:**
1. Check Figma console for errors (Cmd/Ctrl+Option+I)
2. Reload plugin: Close and reopen
3. Restart Figma
4. Reinstall plugin
5. Check browser/app version (update if needed)

### GitHub Authentication Fails

**Symptoms:** "Authentication failed" or "Invalid token"

**Solutions:**
1. Verify token has `repo` scope
2. Check token hasn't expired
3. Ensure repository exists and you have access
4. Try regenerating GitHub token
5. Check repository owner and name are correct

### Tokens Not Syncing

**Symptoms:** Pull/Push doesn't update tokens

**Solutions:**
1. Check network connection
2. Verify GitHub configuration (owner, repo, branch, path)
3. Check GitHub token permissions
4. Look for conflicts in browser console
5. Try manual sync: Pull, then Push

### Performance Issues

**Symptoms:** Plugin feels slow or unresponsive

**Solutions:**
1. Enable virtual scrolling (automatic for >50 tokens)
2. Clear cache: Settings > Clear Cache
3. Reduce number of active filters
4. Close other Figma plugins
5. Restart Figma

### Undo/Redo Not Working

**Symptoms:** Undo button disabled or doesn't restore state

**Solutions:**
1. Check if action is undoable (not all operations support undo)
2. History may be full (50 action limit)
3. Try refreshing plugin
4. Check browser console for errors

### Font Loading Errors

**Symptoms:** "Font not loaded" or "Cannot find font"

**Solutions:**
1. Ensure font is installed on your system
2. Check font name spelling
3. Load font in Figma first
4. Use font family, not specific weight

---

## FAQ

### General Questions

**Q: Is the plugin free?**
A: Yes, the Adobe Spectrum Figma Plugin is open source and free to use.

**Q: Does it work with Figma in the browser?**
A: Yes, it works in both Figma Desktop and Figma in browser.

**Q: Can I use it with other design systems?**
A: While optimized for Adobe Spectrum, the plugin works with any design token format following the DTCG spec.

### Token Management

**Q: How many tokens can I create?**
A: No hard limit. Virtual scrolling handles thousands of tokens efficiently.

**Q: Can I export tokens to other formats?**
A: Yes, tokens can be exported as JSON in DTCG format.

**Q: Do tokens update automatically in Figma?**
A: Tokens are exported from Figma variables. Sync is one-way (Figma → Plugin).

### Storage & Sync

**Q: Where are my tokens stored?**
A: Depends on storage provider:
- **GitHub:** In your GitHub repository
- **Local:** Browser's localStorage
- **URL:** No storage (read-only)

**Q: Can multiple people collaborate?**
A: Yes, using GitHub storage. Each person can pull/push changes.

**Q: What happens if there's a conflict?**
A: Last write wins. Use Git to resolve conflicts manually.

### Advanced Usage

**Q: Can I use the plugin programmatically?**
A: Yes, see API_DOCUMENTATION.md for programmatic usage.

**Q: Can I create custom token types?**
A: Yes, any string can be a token type. The plugin doesn't restrict types.

**Q: Does it support token aliases?**
A: Yes, use `{token-name}` syntax for references.

### Troubleshooting

**Q: Why can't I undo certain operations?**
A: Some operations (like changing settings) aren't recorded in history. Only token CRUD operations support undo.

**Q: The plugin is slow with many tokens. What can I do?**
A: Virtual scrolling should help. Also try clearing cache and filters.

**Q: My GitHub token stopped working. Why?**
A: Tokens can expire. Generate a new token with the same scopes.

---

## Getting Help

### Resources

- **Documentation:** README.md, API_DOCUMENTATION.md
- **Source Code:** https://github.com/adobe/spectrum-tokens
- **Issues:** https://github.com/adobe/spectrum-tokens/issues
- **Discussions:** https://github.com/adobe/spectrum-tokens/discussions

### Reporting Bugs

Please include:
1. Figma version
2. Plugin version
3. Steps to reproduce
4. Expected vs actual behavior
5. Browser console errors (if any)
6. Screenshots (if applicable)

### Feature Requests

We welcome feature requests! Please:
1. Check existing requests first
2. Describe the use case
3. Explain why it's valuable
4. Propose a solution (if you have one)

---

## License

Copyright 2024 Adobe. Licensed under the Apache License, Version 2.0.

---

**Happy token managing!** 🎨✨
