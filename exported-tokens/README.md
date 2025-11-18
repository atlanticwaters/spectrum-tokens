# Exported Tokens Directory

This directory contains design tokens exported from Figma using the **Spectrum Figma Token Exporter** plugin.

## Purpose

This directory is separate from the core Adobe Spectrum tokens (`/packages/tokens/src/`) to ensure:

* **No overwrites**: Adobe Spectrum tokens are never modified or overwritten
* **Clear separation**: User-generated tokens are clearly distinguished from official Spectrum tokens
* **Easy management**: Exported tokens can be easily reviewed, modified, or deleted
* **Version control**: You can choose whether to commit exported tokens to Git

## File Naming

Exported token files are named after their Figma variable collection:

```
[collection-name].json
```

For example:

* `design-system-colors.json`
* `spacing-tokens.json`
* `typography-values.json`

## File Format

Exported tokens follow the [Design Tokens Community Group specification](https://design-tokens.github.io/community-group/format/) with Adobe Spectrum extensions.

### Example Token

```json
{
  "button-primary-color": {
    "$type": "color",
    "$value": "#0265DC",
    "$description": "Primary color for buttons",
    "$schema": "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "component": "button"
  }
}
```

### Required Properties

* `$value`: The token value (string, number, or object)
* `uuid`: Unique identifier for tracking (v4 UUID format)

### Optional Properties

* `$type`: Token type (color, dimension, opacity, etc.)
* `$description`: Human-readable description
* `$schema`: URL to the token type schema (Adobe Spectrum extension)
* `component`: Component this token belongs to (Adobe Spectrum extension)
* `deprecated`: Whether the token is deprecated
* `private`: Whether the token is for internal use only

## Using Exported Tokens

### 1. Review in Visualizers

View your exported tokens in Adobe Spectrum visualizers:

**S2 Visualizer:**

```bash
cd docs/s2-visualizer
pnpm install
pnpm dev
# Copy your exported JSON to the appropriate directory
```

**S2 Tokens Viewer:**

```bash
cd docs/s2-tokens-viewer
pnpm install
pnpm dev
# Copy your exported JSON to tokens/ directory
```

### 2. Transform with Style Dictionary

Use Style Dictionary to transform tokens into platform-specific formats:

```bash
# Install Style Dictionary
npm install -g style-dictionary

# Create config file (style-dictionary.config.json)
# Run transformation
style-dictionary build
```

### 3. Integrate into Build System

Include exported tokens in your project's build process:

```javascript
import tokens from './exported-tokens/my-collection.json';

// Use tokens in your application
const buttonColor = tokens['button-primary-color'].$value;
```

### 4. Merge with Spectrum Tokens (Advanced)

If you want to extend Adobe Spectrum tokens with your custom tokens:

```javascript
import spectrumTokens from '@adobe/spectrum-tokens';
import customTokens from './exported-tokens/my-collection.json';

const allTokens = {
  ...spectrumTokens,
  ...customTokens
};
```

## Validation

Validate your exported tokens against Adobe Spectrum schemas:

```bash
# Using AJV (JSON Schema validator)
npm install -g ajv-cli

# Validate against schema
ajv validate \
  -s docs/site/public/schemas/token-types/token.json \
  -d exported-tokens/my-collection.json
```

## Best Practices

### 1. Organize by Purpose

Export separate collections for different purposes:

* `colors.json` - Color tokens
* `spacing.json` - Spacing and dimension tokens
* `typography.json` - Typography tokens
* `component-button.json` - Component-specific tokens

### 2. Use Descriptive Names

Name your Figma collections descriptively so exported files are self-documenting:

* ✅ `design-system-colors`
* ❌ `collection-1`

### 3. Document Your Tokens

Add descriptions to your Figma variables - they'll be exported as `$description`:

```
Variable name: button-height
Description: Height of standard button in default size
Value: 32
```

### 4. Review Before Committing

Always review exported tokens before committing to version control:

* Check for sensitive data (API keys, internal URLs)
* Verify values are correct
* Ensure naming is consistent
* Validate against schemas

### 5. Version Your Exports

Consider adding version numbers or dates to track changes:

* `colors-v1.json`
* `spacing-2024-11-18.json`

## Gitignore

This directory is **NOT** gitignored by default. You can choose to:

**Option A: Track exported tokens** (recommended for team sharing)

```
# No changes needed - files will be committed
```

**Option B: Ignore exported tokens** (for local-only exports)

```
# Add to .gitignore
exported-tokens/*.json
!exported-tokens/README.md
```

## Troubleshooting

### Token not showing in visualizer

1. Check file format is valid JSON
2. Verify tokens have required properties (`$value`, `uuid`)
3. Ensure `$schema` URLs are correct
4. Check visualizer is configured to load from this directory

### Invalid color values

Color values must be in hex format:

* ✅ `#FF0000` (RGB)
* ✅ `#FF0000FF` (RGBA)
* ❌ `rgb(255, 0, 0)`
* ❌ `red`

### Missing UUIDs

All tokens must have a `uuid` property. If missing, the plugin may have encountered an error during export. Re-export the collection.

### Alias references not working

Alias references must use the correct format:

* ✅ `{token-name}`
* ❌ `token-name`
* ❌ `$token-name`

## Support

For issues with the Figma plugin or exported tokens:

* **Documentation**: `/tools/figma-plugin/README.md`
* **Issues**: <https://github.com/adobe/spectrum-tokens/issues>
* **Discussions**: <https://github.com/adobe/spectrum-tokens/discussions>

## Related Documentation

* [Design Tokens Specification](https://design-tokens.github.io/community-group/format/)
* [Adobe Spectrum Tokens](https://github.com/adobe/spectrum-tokens)
* [Figma Variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
* [Style Dictionary](https://amzn.github.io/style-dictionary/)
