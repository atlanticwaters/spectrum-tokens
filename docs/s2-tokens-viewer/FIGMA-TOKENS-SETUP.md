# Figma Tokens in S2 Tokens Viewer

Your exported Figma tokens have been successfully integrated into the Spectrum 2 Tokens Viewer!

## What Was Done

1. ✅ Converted DTCG format tokens to Spectrum format
2. ✅ Created `tokens/figma-export.json` (113KB, 465 tokens)
3. ✅ Added "Figma Export" tab to the viewer
4. ✅ Configured the viewer to load your tokens

## How to View Your Tokens

### Option 1: Open the HTML file directly

```bash
# Open in your default browser
open /Users/HF48VKQ/Documents/GitHub/spectrum-tokens/docs/s2-tokens-viewer/index.html
```

**Note:** Some browsers (Chrome) may block local file loading due to CORS. If this happens, use Option 2.

### Option 2: Run a local server

```bash
# Navigate to the s2-tokens-viewer directory
cd /Users/HF48VKQ/Documents/GitHub/spectrum-tokens/docs/s2-tokens-viewer

# Start a simple HTTP server (Python 3)
python3 -m http.server 8000

# Or use Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open: <http://localhost:8000>

### Option 3: Use VS Code Live Server

If you have the Live Server extension in VS Code:

1. Right-click `index.html`
2. Select "Open with Live Server"

## What You'll See

Click the **"Figma Export"** tab to see your 465 tokens organized as:

* **206 String tokens** - Font weights, aliases
* **121 Color tokens** - RGB/RGBA colors with swatches
* **104 Dimension tokens** - Sizes in pixels
* **21 Font Family tokens**
* **13 Number tokens** - Opacity values, multipliers

## Features

* **Search:** Type to filter tokens by name or value
* **Color format:** Switch between RGB and Hex
* **Theme toggle:** View tokens in light/dark mode
* **Token details:** Click any token to see full details
* **Source tracking:** See which file each token comes from

## Token Structure

Your tokens are now in Spectrum format:

```json
{
  "font-font-size-h1": {
    "value": "32px",
    "uuid": "VariableID:...",
    "$schema": "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/dimension.json"
  }
}
```

## Re-exporting Tokens

To update the viewer with new Figma exports:

```bash
# 1. Export tokens from Figma plugin
# 2. Convert to Spectrum format
cd /Users/HF48VKQ/Documents/GitHub/spectrum-tokens/tools/figma-plugin
node convert-dtcg-to-spectrum.js \
  ~/Downloads/design-tokens.json \
  ../../docs/s2-tokens-viewer/tokens/figma-export.json

# 3. Refresh the browser
```

## Customization

### Change Tab Name

Edit `index.html` line 66 and 81:

```html
<button class="tab-button" data-tab="figma-export">Your Custom Name</button>
```

### Add Multiple Exports

Create multiple JSON files (e.g., `figma-colors.json`, `figma-layout.json`) and add them to the config:

```javascript
const config = {
  jsonFiles: [
    // ... existing files ...
    "tokens/figma-colors.json",
    "tokens/figma-layout.json",
  ],
};
```

Then add corresponding tabs in the HTML.

## Troubleshooting

### Tokens not showing

* Check browser console for errors
* Verify `figma-export.json` exists in `tokens/` directory
* Make sure you're using a local server (not file://)

### Colors appear as "NaN"

* The converter handles both `{r,g,b}` and `components` array formats
* If you see NaN, check the original token format

### Aliases not resolving

* Aliases reference tokens by name (e.g., `{brand.brand-300}`)
* If the referenced token isn't in the same file, it won't resolve
* Export all related collections together

## Next Steps

* Export additional Figma collections and add them as separate tabs
* Customize the viewer styling to match your brand
* Use the tokens in your design system documentation
* Share the viewer URL with your team

Enjoy exploring your design tokens! 🎨
