#!/usr/bin/env node

/**
 * Token Analysis Tool
 * Shows detailed breakdown of exported tokens and their relationships
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node analyze-tokens.js <path-to-tokens.json>");
  process.exit(1);
}

const tokenFile = resolve(args[0]);
const content = readFileSync(tokenFile, "utf-8");
const tokens = JSON.parse(content);

const analysis = {
  totalTokens: 0,
  byType: {},
  aliases: [],
  baseTokens: [],
  withExtensions: 0,
  colorFormats: { rgb: 0, rgba: 0, hex: 0, alias: 0 },
  dimensionUnits: {},
};

function isAlias(value) {
  return (
    typeof value === "string" && value.startsWith("{") && value.endsWith("}")
  );
}

function analyzeTokenValue(name, token) {
  const value = token.$value;
  const type = token.$type;

  if (isAlias(value)) {
    analysis.aliases.push({ name, type, reference: value });
    if (type === "color") analysis.colorFormats.alias++;
  } else {
    analysis.baseTokens.push({ name, type, value });

    // Analyze color formats
    if (type === "color") {
      if (typeof value === "object") {
        if ("alpha" in value) {
          analysis.colorFormats.rgba++;
        } else {
          analysis.colorFormats.rgb++;
        }
      } else if (typeof value === "string" && value.startsWith("#")) {
        analysis.colorFormats.hex++;
      }
    }

    // Analyze dimension units
    if (type === "dimension" && typeof value === "object" && value.unit) {
      analysis.dimensionUnits[value.unit] =
        (analysis.dimensionUnits[value.unit] || 0) + 1;
    }
  }
}

function walkTokens(obj, prefix = "") {
  for (const [key, value] of Object.entries(obj)) {
    const tokenName = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object") {
      if ("$value" in value || "$type" in value) {
        analysis.totalTokens++;
        const type = value.$type || "unknown";
        analysis.byType[type] = (analysis.byType[type] || 0) + 1;

        if (value.$extensions) {
          analysis.withExtensions++;
        }

        if (value.$value !== undefined) {
          analyzeTokenValue(tokenName, value);
        }
      } else {
        walkTokens(value, tokenName);
      }
    }
  }
}

walkTokens(tokens);

// Print analysis
console.log("\n📊 Token Analysis Report");
console.log("═".repeat(70));

console.log(`\n📈 Overview:`);
console.log(`   Total Tokens: ${analysis.totalTokens}`);
console.log(`   Base Tokens: ${analysis.baseTokens.length}`);
console.log(`   Alias References: ${analysis.aliases.length}`);
console.log(`   With Figma Metadata: ${analysis.withExtensions}`);

console.log(`\n🏷️  Tokens by Type:`);
const sortedTypes = Object.entries(analysis.byType).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedTypes) {
  const pct = ((count / analysis.totalTokens) * 100).toFixed(1);
  const bar = "█".repeat(Math.ceil((count / analysis.totalTokens) * 30));
  console.log(
    `   ${type.padEnd(15)} ${count.toString().padStart(4)} (${pct}%) ${bar}`,
  );
}

if (analysis.aliases.length > 0) {
  console.log(`\n🔗 Alias Tokens (${analysis.aliases.length} total):`);
  console.log(`   Top 10 aliases:`);
  analysis.aliases.slice(0, 10).forEach((alias, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${alias.name}`);
    console.log(`       → ${alias.reference}`);
  });
  if (analysis.aliases.length > 10) {
    console.log(`       ... and ${analysis.aliases.length - 10} more`);
  }

  // Check for broken references
  console.log(`\n🔍 Reference Validation:`);
  const allTokenNames = new Set([
    ...analysis.baseTokens.map((t) => t.name),
    ...analysis.aliases.map((t) => t.name),
  ]);

  const brokenRefs = [];
  for (const alias of analysis.aliases) {
    const ref = alias.reference.slice(1, -1); // Remove { }
    if (!allTokenNames.has(ref)) {
      brokenRefs.push({ alias: alias.name, missing: ref });
    }
  }

  if (brokenRefs.length > 0) {
    console.log(
      `   ⚠️  ${brokenRefs.length} aliases reference tokens not in this file`,
    );
    console.log(`   This is normal if tokens are split across multiple files.`);
    console.log(`\n   Examples:`);
    brokenRefs.slice(0, 5).forEach((ref) => {
      console.log(`   - ${ref.alias} → {${ref.missing}}`);
    });
  } else {
    console.log(`   ✅ All aliases reference tokens within this file`);
  }
}

if (
  Object.keys(analysis.colorFormats).some((k) => analysis.colorFormats[k] > 0)
) {
  console.log(`\n🎨 Color Formats:`);
  if (analysis.colorFormats.rgb > 0)
    console.log(`   RGB objects: ${analysis.colorFormats.rgb}`);
  if (analysis.colorFormats.rgba > 0)
    console.log(`   RGBA objects: ${analysis.colorFormats.rgba}`);
  if (analysis.colorFormats.hex > 0)
    console.log(`   Hex strings: ${analysis.colorFormats.hex}`);
  if (analysis.colorFormats.alias > 0)
    console.log(`   Color aliases: ${analysis.colorFormats.alias}`);
}

if (Object.keys(analysis.dimensionUnits).length > 0) {
  console.log(`\n📏 Dimension Units:`);
  for (const [unit, count] of Object.entries(analysis.dimensionUnits)) {
    console.log(`   ${unit}: ${count}`);
  }
}

console.log(`\n💡 Sample Base Tokens:`);
analysis.baseTokens.slice(0, 5).forEach((token) => {
  console.log(`\n   ${token.name}`);
  console.log(`   Type: ${token.type}`);
  const valueStr =
    typeof token.value === "object" ? JSON.stringify(token.value) : token.value;
  console.log(`   Value: ${valueStr.substring(0, 60)}`);
});

console.log("\n" + "═".repeat(70) + "\n");
