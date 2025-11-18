#!/usr/bin/env node

/**
 * Simple DTCG to CSS Variables Converter
 * Converts design tokens to CSS custom properties
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node convert-to-css.js <input.json> [output.css]");
  process.exit(1);
}

const inputFile = resolve(args[0]);
const outputFile = args[1] || "./tokens-output/variables.css";

try {
  console.log("🔄 Converting tokens to CSS...\n");
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}\n`);

  const tokens = JSON.parse(readFileSync(inputFile, "utf-8"));
  const css = [
    "/**",
    " * Design Tokens - CSS Variables",
    ` * Generated from: ${inputFile.split("/").pop()}`,
    ` * Date: ${new Date().toISOString()}`,
    " */",
    "",
    ":root {",
  ];

  const stats = {
    total: 0,
    aliases: 0,
    byType: {},
  };

  function formatValue(value, type) {
    // Handle aliases
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      stats.aliases++;
      // Convert {foo.bar.baz} to var(--foo-bar-baz)
      const ref = value.slice(1, -1).replace(/\./g, "-");
      return `var(--${ref})`;
    }

    // Handle primitives
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }

    // Handle RGB/RGBA colors
    if (type === "color" && typeof value === "object") {
      // Handle components array format (DTCG spec)
      if ("components" in value && Array.isArray(value.components)) {
        const r = Math.round(value.components[0] * 255);
        const g = Math.round(value.components[1] * 255);
        const b = Math.round(value.components[2] * 255);

        if ("alpha" in value && value.alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${value.alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }

      // Handle r/g/b format (legacy)
      if ("r" in value && "g" in value && "b" in value) {
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);

        if ("alpha" in value && value.alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${value.alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }

      // If hex is available, use that
      if ("hex" in value) {
        return value.hex;
      }
    }

    // Handle dimensions
    if (type === "dimension" && typeof value === "object") {
      return `${value.value}${value.unit}`;
    }

    // Fallback
    return JSON.stringify(value);
  }

  function walkTokens(obj, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const tokenName = prefix ? `${prefix}-${key}` : key;

      if (value && typeof value === "object" && "$value" in value) {
        stats.total++;
        const type = value.$type || "unknown";
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        const cssValue = formatValue(value.$value, type);
        const comment = value.$description
          ? ` /* ${value.$description} */`
          : "";
        css.push(`  --${tokenName}: ${cssValue};${comment}`);
      } else if (value && typeof value === "object") {
        walkTokens(value, tokenName);
      }
    }
  }

  walkTokens(tokens);
  css.push("}");
  css.push("");

  // Ensure output directory exists
  mkdirSync(dirname(outputFile), { recursive: true });

  // Write CSS file
  writeFileSync(outputFile, css.join("\n"));

  console.log("✅ Conversion complete!\n");
  console.log("📊 Statistics:");
  console.log(`   Total CSS variables: ${stats.total}`);
  console.log(`   Alias references: ${stats.aliases}`);
  console.log("\n   Variables by type:");

  for (const [type, count] of Object.entries(stats.byType).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`   - ${type}: ${count}`);
  }

  console.log(`\n📄 Output written to: ${outputFile}`);
  console.log("\n💡 Usage in HTML:");
  console.log('   <link rel="stylesheet" href="variables.css">');
  console.log('   <div style="color: var(--text-primary)">Hello</div>');
  console.log("");
} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
}
