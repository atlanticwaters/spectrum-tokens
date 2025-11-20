import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes("--watch");

/**
 * Build configuration for Figma plugin with React
 * - Plugin code runs in Figma sandbox (no DOM access)
 * - UI code runs in iframe (has DOM access, React app)
 */

const sharedConfig = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? "inline" : false,
  logLevel: "info",
  target: "es2017", // Figma doesn't support ES2020 optional chaining
};

// Build plugin code (runs in Figma sandbox)
const pluginConfig = {
  ...sharedConfig,
  entryPoints: [resolve(__dirname, "src/plugin/code.ts")],
  outfile: resolve(__dirname, "dist/code.js"),
  platform: "browser",
  format: "iife",
};

// Build UI code with React JSX support (runs in iframe)
const uiConfig = {
  ...sharedConfig,
  entryPoints: [resolve(__dirname, "src/ui/index.tsx")],
  outfile: resolve(__dirname, "dist/ui.js"),
  platform: "browser",
  format: "iife",
  jsx: "automatic", // Use React 17+ automatic JSX runtime
  jsxDev: isWatch, // Enable dev mode JSX in watch mode
};

async function build() {
  try {
    // Ensure dist directory exists
    mkdirSync(resolve(__dirname, "dist"), { recursive: true });

    if (isWatch) {
      console.log("👀 Watching for changes...\n");

      // In watch mode, HTML is not inlined, so copy it to dist
      const htmlContent = readFileSync(
        resolve(__dirname, "src/ui/ui.html"),
        "utf-8"
      );
      writeFileSync(resolve(__dirname, "dist/ui.html"), htmlContent);

      const pluginContext = await esbuild.context(pluginConfig);
      const uiContext = await esbuild.context(uiConfig);

      await Promise.all([pluginContext.watch(), uiContext.watch()]);

      console.log("✨ Build complete. Watching for changes...");
    } else {
      console.log("🔨 Building plugin...\n");

      // Build UI first
      await esbuild.build(uiConfig);

      // Read built UI JS and HTML
      const uiJs = readFileSync(resolve(__dirname, "dist/ui.js"), "utf-8");
      const htmlContent = readFileSync(
        resolve(__dirname, "src/ui/ui.html"),
        "utf-8"
      );

      // Inline JavaScript using base64 to avoid any escaping issues
      const base64Js = Buffer.from(uiJs).toString('base64');
      const inlineScript = `
        <script>
          (function() {
            const script = document.createElement('script');
            script.textContent = atob('${base64Js}');
            document.head.appendChild(script);
          })();
        </script>
      `;

      // Replace the script tag with inlined version
      const htmlWithInlinedJs = htmlContent.replace(
        '<script src="ui.js"></script>',
        inlineScript
      );

      // Write final HTML to dist
      writeFileSync(resolve(__dirname, "dist/ui.html"), htmlWithInlinedJs);

      // Build plugin code
      await esbuild.build(pluginConfig);

      console.log("\n✅ Build complete!");
      console.log("📦 Output:");
      console.log("   - dist/code.js (plugin code)");
      console.log("   - dist/ui.html (UI with inlined JS via base64)");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
