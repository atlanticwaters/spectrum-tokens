# Installing the Plugin in Figma

## Development Mode

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest...**
3. Navigate to: `/Users/HF48VKQ/Documents/GitHub/spectrum-tokens/tools/figma-plugin/`
4. Select `manifest.json`
5. Click **Open**

## If You Get Errors

If you see "Syntax error on line 1: Unexpected token ." try:

1. **Rebuild the plugin:**
   ```bash
   cd /Users/HF48VKQ/Documents/GitHub/spectrum-tokens/tools/figma-plugin
   pnpm build
   ```

2. **Remove and re-import:**
   * In Figma: Plugins → Development → Remove plugin
   * Then re-import using steps above

3. **Check Figma version:**
   * This plugin requires Figma Desktop app (not browser)
   * Update to latest Figma version if needed

4. **Clear Figma cache:**
   * Close Figma completely
   * Delete cache: `~/Library/Application Support/Figma/`
   * Restart Figma and try again
