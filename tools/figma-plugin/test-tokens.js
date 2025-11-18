#!/usr/bin/env node

/**
 * Token File Validator and Inspector
 * Tests exported design tokens for correctness
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node test-tokens.js <path-to-tokens.json>");
  process.exit(1);
}

const tokenFile = resolve(args[0]);

try {
  console.log("🔍 Reading token file:", tokenFile);
  const content = readFileSync(tokenFile, "utf-8");
  const tokens = JSON.parse(content);

  console.log("\n✅ Valid JSON structure\n");

  // Analyze token structure
  const stats = {
    totalTokens: 0,
    byType: {},
    hasExtensions: 0,
    missingValue: [],
    missingType: [],
  };

  function analyzeToken(name, token) {
    stats.totalTokens++;

    if (!token.$value && token.$value !== 0) {
      stats.missingValue.push(name);
    }

    if (token.$type) {
      stats.byType[token.$type] = (stats.byType[token.$type] || 0) + 1;
    } else {
      stats.missingType.push(name);
    }

    if (token.$extensions) {
      stats.hasExtensions++;
    }
  }

  // Recursively analyze tokens
  function walkTokens(obj, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const tokenName = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object") {
        // Check if this is a token (has $value or $type)
        if ("$value" in value || "$type" in value) {
          analyzeToken(tokenName, value);
        } else {
          // It's a group, recurse
          walkTokens(value, tokenName);
        }
      }
    }
  }

  walkTokens(tokens);

  // Print statistics
  console.log("📊 Token Statistics:");
  console.log("─".repeat(50));
  console.log(`Total Tokens: ${stats.totalTokens}`);
  console.log(`\nTokens by Type:`);

  const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const bar = "█".repeat(Math.ceil((count / stats.totalTokens) * 20));
    console.log(`  ${type.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
  }

  console.log(`\nTokens with Figma metadata: ${stats.hasExtensions}`);

  // Warnings
  if (stats.missingValue.length > 0) {
    console.log(`\n⚠️  Tokens missing $value: ${stats.missingValue.length}`);
    stats.missingValue
      .slice(0, 5)
      .forEach((name) => console.log(`   - ${name}`));
    if (stats.missingValue.length > 5) {
      console.log(`   ... and ${stats.missingValue.length - 5} more`);
    }
  }

  if (stats.missingType.length > 0) {
    console.log(`\n⚠️  Tokens missing $type: ${stats.missingType.length}`);
    stats.missingType
      .slice(0, 5)
      .forEach((name) => console.log(`   - ${name}`));
    if (stats.missingType.length > 5) {
      console.log(`   ... and ${stats.missingType.length - 5} more`);
    }
  }

  // Sample tokens
  console.log("\n📝 Sample Tokens:");
  console.log("─".repeat(50));

  const sampleTokens = Object.entries(tokens).slice(0, 3);
  for (const [name, token] of sampleTokens) {
    console.log(`\n${name}:`);
    console.log(`  Type: ${token.$type || "N/A"}`);
    console.log(`  Value: ${JSON.stringify(token.$value)}`);
    if (token.$description) {
      console.log(`  Description: ${token.$description}`);
    }
  }

  console.log("\n✅ Token file is valid and ready to use!\n");
} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
}
