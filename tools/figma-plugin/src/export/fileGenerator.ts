/**
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * File Generator
 * Generates formatted JSON files for token export
 */

import type {
  DesignToken,
  SpectrumToken,
  ExportSettings,
} from "../shared/types";
import { transformToStyleDictionary } from "./styleDictionaryTransformer";

export interface ExportFile {
  filename: string;
  content: string;
  format: "dtcg" | "spectrum" | "style-dictionary";
  size: number;
}

/**
 * Generate DTCG format JSON file
 */
export function generateDTCGFile(
  tokens: Record<string, DesignToken | Record<string, unknown>>,
  settings: ExportSettings,
  collectionName?: string,
): ExportFile {
  const filename = collectionName
    ? `${sanitizeFilename(collectionName)}-dtcg.json`
    : "design-tokens.json";

  // Format JSON with 2-space indentation
  const content = JSON.stringify(tokens, null, 2);

  return {
    filename,
    content,
    format: "dtcg",
    size: content.length,
  };
}

/**
 * Generate Spectrum format JSON file
 */
export function generateSpectrumFile(
  tokens: Record<string, SpectrumToken>,
  settings: ExportSettings,
  collectionName?: string,
): ExportFile {
  const filename = collectionName
    ? `${sanitizeFilename(collectionName)}-spectrum.json`
    : "spectrum-tokens.json";

  // Format JSON with 2-space indentation
  const content = JSON.stringify(tokens, null, 2);

  return {
    filename,
    content,
    format: "spectrum",
    size: content.length,
  };
}

/**
 * Generate Style Dictionary format JSON file
 * Transforms DTCG tokens to Style Dictionary-compatible format
 */
export function generateStyleDictionaryFile(
  tokens: Record<string, DesignToken | Record<string, unknown>>,
  settings: ExportSettings,
  collectionName?: string,
  platform?: "ios" | "android" | "web" | "compose",
): ExportFile {
  const platformSuffix = platform ? `-${platform}` : "";
  const filename = collectionName
    ? `${sanitizeFilename(collectionName)}-style-dictionary${platformSuffix}.json`
    : `style-dictionary${platformSuffix}.json`;

  // Transform DTCG tokens to Style Dictionary format
  const styleDictionaryTokens = transformToStyleDictionary(tokens, {
    platform,
    includeTransforms: true,
  });

  // Format JSON with 2-space indentation
  const content = JSON.stringify(styleDictionaryTokens, null, 2);

  return {
    filename,
    content,
    format: "style-dictionary",
    size: content.length,
  };
}

/**
 * Generate README file for exported tokens
 */
export function generateReadme(stats: {
  totalTokens: number;
  collections: number;
  exportDate: string;
  warnings: number;
  errors: number;
}): ExportFile {
  const content = `# Exported Design Tokens

**Export Date:** ${stats.exportDate}
**Total Tokens:** ${stats.totalTokens}
**Collections:** ${stats.collections}
**Warnings:** ${stats.warnings}
**Errors:** ${stats.errors}

## Files Included

This directory contains design tokens exported from Figma using the Spectrum Token Exporter plugin.

### File Formats

- \`*-dtcg.json\` - W3C Design Tokens Community Group format
- \`*-spectrum.json\` - Adobe Spectrum format
- \`*-style-dictionary.json\` - Style Dictionary format with custom transforms

### Usage

These tokens can be used with:
- Adobe Spectrum visualizers
- Style Dictionary (internal tooling)
- Design system tools
- Custom token processors

### DTCG Format

Design Tokens follow the W3C DTCG specification:
- Each token has \`$value\` and \`$type\` properties
- Tokens are organized in nested groups
- References use \`{token.name}\` syntax

### Spectrum Format

Spectrum tokens include:
- \`$schema\` - Schema validation URL
- \`uuid\` - Unique identifier for tracking
- \`value\` - Token value
- \`component\` - Associated component (if applicable)

### Style Dictionary Format

Style Dictionary tokens are transformed for use with internal tooling:
- Compatible with Style Dictionary build system
- Includes \`type\`, \`value\`, and \`path\` properties
- Supports custom transforms for iOS, Android, Compose, and Web platforms
- Token paths are preserved for hierarchical organization
- Original values maintained in \`original.value\` for reference

## Next Steps

1. Review the exported tokens
2. Import into your design system
3. Use with Adobe Spectrum visualizers
4. Integrate with your build tools

---

Generated with [Claude Code](https://claude.com/claude-code)
`;

  return {
    filename: "README.md",
    content,
    format: "dtcg", // Arbitrary choice
    size: content.length,
  };
}

/**
 * Generate export manifest with metadata
 */
export function generateManifest(
  files: ExportFile[],
  settings: ExportSettings,
  stats: {
    totalTokens: number;
    collections: number;
    warnings: string[];
    errors: string[];
  },
): ExportFile {
  const manifest = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    settings: {
      format: settings.format,
      structure: settings.structure,
      namingConvention: settings.namingConvention,
      defaultUnit: settings.defaultUnit,
    },
    statistics: {
      totalTokens: stats.totalTokens,
      totalCollections: stats.collections,
      totalFiles: files.length,
      warnings: stats.warnings.length,
      errors: stats.errors.length,
    },
    files: files.map((f) => ({
      filename: f.filename,
      format: f.format,
      size: f.size,
    })),
    warnings: stats.warnings,
    errors: stats.errors,
  };

  const content = JSON.stringify(manifest, null, 2);

  return {
    filename: "export-manifest.json",
    content,
    format: "dtcg",
    size: content.length,
  };
}

/**
 * Sanitize filename for safe file creation
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Create a downloadable blob from file content
 */
export function createDownloadBlob(file: ExportFile): Blob {
  return new Blob([file.content], { type: "application/json" });
}
