#!/usr/bin/env node

/**
 * Convert DTCG format tokens to Spectrum format for s2-tokens-viewer
 *
 * DTCG format: { "$value": ..., "$type": ..., "$extensions": ... }
 * Spectrum format: { "value": ..., "uuid": ..., "$schema": ... }
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import crypto from "crypto";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: node convert-dtcg-to-spectrum.js <input-dtcg.json> <output-spectrum.json>",
  );
  process.exit(1);
}

const inputFile = resolve(args[0]);
const outputFile = resolve(args[1]);

try {
  console.log("🔄 Converting DTCG to Spectrum format...\n");
  console.log(`Input:  ${inputFile}`);
  console.log(`Output: ${outputFile}\n`);

  const dtcgTokens = JSON.parse(readFileSync(inputFile, "utf-8"));
  const spectrumTokens = {};

  const stats = {
    converted: 0,
    skipped: 0,
    byType: {},
  };

  function transformValue(value, type) {
    // Handle aliases (keep as-is with curly braces)
    if (
      typeof value === "string" &&
      value.startsWith("{") &&
      value.endsWith("}")
    ) {
      return value;
    }

    // Handle primitives
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }

    // Handle color objects
    if (type === "color" && typeof value === "object" && value !== null) {
      // Handle DTCG components array format
      if ("components" in value && Array.isArray(value.components)) {
        const r = Math.round(value.components[0] * 255);
        const g = Math.round(value.components[1] * 255);
        const b = Math.round(value.components[2] * 255);

        if ("alpha" in value && value.alpha < 1) {
          return `rgba(${r}, ${g}, ${b}, ${value.alpha})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }

      // Handle r/g/b format
      if ("r" in value && "g" in value && "b" in value) {
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);

        if ("a" in value && value.a < 1) {
          return `rgba(${r}, ${g}, ${b}, ${value.a})`;
        }
        return `rgb(${r}, ${g}, ${b})`;
      }

      // If hex is available, use it
      if ("hex" in value) {
        return value.hex;
      }
    }

    // Handle dimension objects
    if (type === "dimension" && typeof value === "object" && value !== null) {
      if ("value" in value && "unit" in value) {
        return `${value.value}${value.unit}`;
      }
    }

    // Fallback: return as-is or stringify
    return typeof value === "object" ? JSON.stringify(value) : value;
  }

  function convertToken(name, dtcgToken) {
    // Skip if not a token (might be a group)
    if (
      !dtcgToken ||
      typeof dtcgToken !== "object" ||
      !("$value" in dtcgToken)
    ) {
      return null;
    }

    const spectrumToken = {};

    // Convert $value to value (transform complex types to strings)
    spectrumToken.value = transformValue(dtcgToken.$value, dtcgToken.$type);

    // Extract UUID from extensions if available, otherwise use existing uuid
    if (dtcgToken.$extensions?.["com.figma"]?.variableId) {
      // Use Figma variable ID as a base for UUID (you may want to generate proper UUIDs)
      const varId = dtcgToken.$extensions["com.figma"].variableId;
      // Extract or use the variable ID directly
      spectrumToken.uuid = varId;
    } else if (dtcgToken.uuid) {
      spectrumToken.uuid = dtcgToken.uuid;
    } else {
      // Generate a simple UUID-like string from token name
      spectrumToken.uuid = generateUUID(name);
    }

    // Convert $type to $schema
    if (dtcgToken.$type) {
      const schemaBase =
        "https://opensource.adobe.com/spectrum-tokens/schemas/token-types";
      const typeMapping = {
        color: "color.json",
        dimension: "dimension.json",
        fontFamily: "font-family.json",
        fontWeight: "font-weight.json",
        number: "opacity.json", // or multiplier.json depending on use
        string: "alias.json",
        duration: "duration.json",
      };

      const schemaFile = typeMapping[dtcgToken.$type] || "alias.json";
      spectrumToken.$schema = `${schemaBase}/${schemaFile}`;
    }

    // Add component if available in extensions
    if (dtcgToken.$extensions?.["com.figma"]?.component) {
      spectrumToken.component = dtcgToken.$extensions["com.figma"].component;
    }

    // Add private flag if hidden
    if (dtcgToken.$extensions?.["com.figma"]?.hiddenFromPublishing) {
      spectrumToken.private = true;
    }

    stats.converted++;
    const type = dtcgToken.$type || "unknown";
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    return spectrumToken;
  }

  function generateUUID(name) {
    // Simple UUID v5-like generation from name
    const hash = crypto.createHash("sha256").update(name).digest("hex");
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }

  function walkTokens(obj, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const tokenName = prefix ? `${prefix}.${key}` : key;

      if (
        value &&
        typeof value === "object" &&
        ("$value" in value || "$type" in value)
      ) {
        const converted = convertToken(tokenName, value);
        if (converted) {
          // Use the last part of the path as the key (e.g., "font.size.h1" -> "h1")
          // Or use full path with dashes (e.g., "font-size-h1")
          const tokenKey = tokenName.replace(/\./g, "-");
          spectrumTokens[tokenKey] = converted;
        } else {
          stats.skipped++;
        }
      } else if (value && typeof value === "object") {
        // Recurse into groups
        walkTokens(value, tokenName);
      }
    }
  }

  walkTokens(dtcgTokens);

  // Write output
  writeFileSync(outputFile, JSON.stringify(spectrumTokens, null, 2));

  console.log("✅ Conversion complete!\n");
  console.log("📊 Statistics:");
  console.log(`   Converted: ${stats.converted} tokens`);
  console.log(`   Skipped: ${stats.skipped} items`);
  console.log("\n   Tokens by type:");

  for (const [type, count] of Object.entries(stats.byType).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`   - ${type}: ${count}`);
  }

  console.log(`\n📄 Output written to: ${outputFile}`);
  console.log("\n💡 Next steps:");
  console.log("   1. Copy the file to docs/s2-tokens-viewer/tokens/");
  console.log("   2. Add a new tab in index.html");
  console.log("   3. Update the config to load your tokens");
  console.log("");
} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
}
