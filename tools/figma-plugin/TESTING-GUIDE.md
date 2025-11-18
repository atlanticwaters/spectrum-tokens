# Testing Your Exported Design Tokens

This guide shows you how to test and use the design tokens exported from the Figma plugin.

## What You Exported

Your `design-tokens.json` file contains:

* **465 total tokens** in DTCG (W3C Design Tokens Community Group) format
* **259 base tokens** (actual values)
* **206 alias tokens** (references to other tokens)
* Full Figma metadata for each token

### Token Breakdown:

* **Strings**: 206 tokens (mostly aliases and font weights)
* **Colors**: 121 tokens (RGB/RGBA format)
* **Dimensions**: 104 tokens (in pixels)
* **Font Families**: 21 tokens
* **Numbers**: 13 tokens (opacity, multipliers)

## Testing Options

### 1. Validate Token Structure ✅

**Quick validation:**

```bash
node test-tokens.js ~/Downloads/design-tokens.json
```

**Detailed analysis:**

```bash
node analyze-tokens.js ~/Downloads/design-tokens.json
```

This shows:

* Token statistics by type
* Alias relationships
* Broken references (expected if tokens are split across files)
* Color formats and dimension units

### 2. Use with Adobe Spectrum Tools

#### Option A: Compare with Existing Spectrum Tokens

```bash
# Navigate to spectrum-tokens packages
cd /Users/HF48VKQ/Documents/GitHub/spectrum-tokens/packages/tokens

# Compare structure with existing Spectrum tokens
ls -la
```

Your tokens follow the same DTCG format as Adobe Spectrum tokens, so they can be:

* Integrated into the Spectrum design system
* Used with Spectrum CSS
* Transformed using the same build tools

#### Option B: Generate CSS Variables

Create a simple converter:

```javascript
// convert-to-css.js
import fs from 'fs';

const tokens = JSON.parse(fs.readFileSync('./tokens-input/design-tokens.json', 'utf-8'));
const css = [':root {'];

function walkTokens(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const tokenName = prefix ? `${prefix}-${key}` : key;

    if (value && typeof value === 'object' && '$value' in value) {
      const cssValue = formatValue(value.$value, value.$type);
      css.push(`  --${tokenName}: ${cssValue};`);
    } else if (value && typeof value === 'object') {
      walkTokens(value, tokenName);
    }
  }
}

function formatValue(value, type) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;

  // Handle RGB/RGBA colors
  if (type === 'color' && typeof value === 'object') {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);

    if ('alpha' in value) {
      return `rgba(${r}, ${g}, ${b}, ${value.alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Handle dimensions
  if (type === 'dimension' && typeof value === 'object') {
    return `${value.value}${value.unit}`;
  }

  return JSON.stringify(value);
}

walkTokens(tokens);
css.push('}');

fs.writeFileSync('./tokens-output/variables.css', css.join('\n'));
console.log('✅ Generated variables.css');
```

Run it:

```bash
node convert-to-css.js
```

### 3. Use with Style Dictionary (Advanced)

For complex transformations, use Style Dictionary once you have all referenced tokens:

```bash
# Install Style Dictionary
pnpm add -D style-dictionary

# Build with config
npx style-dictionary build --config style-dictionary-config.json
```

**Note:** Currently, some alias references point to tokens not in this export (like `{brand.brand-300}`, `{greige.greige-050}`). This is expected if:

* You have multiple variable collections in Figma
* Base color tokens are in a different collection
* You only exported semantic tokens (not primitives)

**Solution:** Export all related collections together, or ensure base tokens are included.

### 4. Visual Testing with Token Viewer

Create an HTML viewer to see your tokens:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Token Viewer</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    .token { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .token-name { font-weight: bold; }
    .token-value { font-family: monospace; }
    .color-swatch {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 1px solid #000;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h1>Design Tokens</h1>
  <div id="tokens"></div>

  <script type="module">
    const tokens = await fetch('./tokens-input/design-tokens.json').then(r => r.json());
    const container = document.getElementById('tokens');

    function renderToken(name, token) {
      const div = document.createElement('div');
      div.className = 'token';

      let valueDisplay = JSON.stringify(token.$value);
      let swatch = '';

      if (token.$type === 'color' && typeof token.$value === 'object') {
        const r = Math.round(token.$value.r * 255);
        const g = Math.round(token.$value.g * 255);
        const b = Math.round(token.$value.b * 255);
        const a = token.$value.alpha || 1;
        const color = `rgba(${r}, ${g}, ${b}, ${a})`;
        swatch = `<div class="color-swatch" style="background: ${color}"></div>`;
      }

      div.innerHTML = `
        <div class="token-name">${name}</div>
        <div class="token-type">Type: ${token.$type}</div>
        <div class="token-value">Value: ${valueDisplay} ${swatch}</div>
      `;
      container.appendChild(div);
    }

    function walkTokens(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const name = prefix ? `${prefix}.${key}` : key;
        if (value && '$value' in value) {
          renderToken(name, value);
        } else if (typeof value === 'object') {
          walkTokens(value, name);
        }
      }
    }

    walkTokens(tokens);
  </script>
</body>
</html>
```

Save as `token-viewer.html` and open in a browser (you'll need a local server due to CORS).

## Next Steps

### To Use in Production:

1. **Export all collections together** - Include primitive/base tokens with semantic tokens
2. **Transform to your target format** - CSS, SCSS, JavaScript, JSON
3. **Integrate with build system** - Use Style Dictionary or custom scripts
4. **Version control** - Track token changes over time
5. **Document** - Add descriptions to tokens in Figma

### To Integrate with Adobe Spectrum:

1. Match token naming conventions with Spectrum patterns
2. Ensure all base tokens are exported
3. Use Spectrum's token transformation pipeline
4. Test with Spectrum CSS components

## Common Issues

### "Reference doesn't exist" errors

* **Cause:** Alias tokens reference tokens not in the export
* **Fix:** Export all related collections together, or include base tokens

### Type mismatches

* **Cause:** Token type doesn't match value format
* **Fix:** Check Figma variable types match your intent

### Missing metadata

* **Cause:** `includeMetadata` setting was false
* **Fix:** Re-export with metadata enabled in plugin settings

## Resources

* [Design Tokens Community Group](https://www.designtokens.org/)
* [Adobe Spectrum Tokens](https://github.com/adobe/spectrum-tokens)
* [Style Dictionary](https://amzn.github.io/style-dictionary/)
* [Token Format Spec](https://tr.designtokens.org/format/)

## Support

For issues with the Figma plugin:

* Check the console for errors
* Verify token structure with `analyze-tokens.js`
* Report issues with full error messages and token samples
