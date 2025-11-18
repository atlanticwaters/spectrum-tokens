import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWatch = process.argv.includes("--watch");

/**
 * Build configuration for Figma plugin
 * - Plugin code runs in Figma sandbox (no DOM access)
 * - UI code runs in iframe (has DOM access)
 */

const sharedConfig = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? "inline" : false,
  logLevel: "info",
  target: "es2017", // Figma doesn't support ES2020 optional chaining (?.)
};

// Read HTML file for inlining
const htmlContent = readFileSync(resolve(__dirname, "src/ui/ui.html"), "utf-8");

// Build plugin code (runs in Figma sandbox)
const pluginConfig = {
  ...sharedConfig,
  entryPoints: [resolve(__dirname, "src/plugin/code.ts")],
  outfile: resolve(__dirname, "dist/code.js"),
  platform: "browser",
  format: "iife",
  define: {
    __html__: JSON.stringify(htmlContent),
  },
};

// Build UI code (runs in iframe)
const uiConfig = {
  ...sharedConfig,
  entryPoints: [resolve(__dirname, "src/ui/ui.ts")],
  outfile: resolve(__dirname, "dist/ui.js"),
  platform: "browser",
  format: "iife",
};

async function build() {
  try {
    // Ensure dist directory exists
    mkdirSync(resolve(__dirname, "dist"), { recursive: true });

    if (isWatch) {
      console.log("👀 Watching for changes...\n");

      const pluginContext = await esbuild.context(pluginConfig);
      const uiContext = await esbuild.context(uiConfig);

      await Promise.all([pluginContext.watch(), uiContext.watch()]);

      console.log("✨ Build complete. Watching for changes...");
    } else {
      console.log("🔨 Building plugin...\n");

      // Build UI first so we can inline it
      await esbuild.build(uiConfig);

      // Read built UI JS
      const uiJs = readFileSync(resolve(__dirname, "dist/ui.js"), "utf-8");

      // Inject UI JS into HTML
      const htmlWithInlinedJs = htmlContent.replace(
        '<script src="ui.js"></script>',
        `<script>${uiJs}</script>`,
      );

      // Rebuild plugin with updated HTML
      const updatedPluginConfig = {
        ...pluginConfig,
        define: {
          __html__: JSON.stringify(htmlWithInlinedJs),
        },
      };

      await esbuild.build(updatedPluginConfig);

      console.log("\n✅ Build complete!");
      console.log("📦 Output:");
      console.log("   - dist/code.js (plugin code with fully inlined UI)");
    }
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
