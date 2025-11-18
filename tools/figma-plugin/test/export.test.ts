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
 * Tests for export functionality
 * Tests file generation and export coordination
 */

import test from "ava";
import type {
  FigmaVariable,
  FigmaVariableCollection,
  ExportSettings,
  DesignToken,
  SpectrumToken,
} from "../src/shared/types";
import {
  generateDTCGFile,
  generateSpectrumFile,
  generateReadme,
  generateManifest,
  formatFileSize,
  type ExportFile,
} from "../src/export/fileGenerator";
import {
  ExportCoordinator,
  exportTokens,
  type ExportProgress,
} from "../src/export/exportCoordinator";

// ============================================================================
// Test Data
// ============================================================================

const defaultSettings: ExportSettings = {
  format: "both",
  structure: "nested",
  fileOrganization: "single",
  includePrivate: false,
  includeDeprecated: false,
  namingConvention: "kebab-case",
  defaultUnit: "px",
  modeHandling: "auto",
  includeMetadata: true,
  generateUUIDs: "deterministic",
};

const mockDTCGTokens: Record<string, DesignToken> = {
  "primary-blue": {
    $type: "color",
    $value: {
      colorSpace: "srgb",
      components: [0, 0.4, 0.8],
      hex: "#0066CC",
    },
    $description: "Primary brand color",
  },
  "font-size-large": {
    $type: "dimension",
    $value: "24px",
    $description: "Large font size",
  },
};

const mockSpectrumTokens: Record<string, SpectrumToken> = {
  "primary-blue": {
    $schema:
      "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    value: "rgb(0, 102, 204)",
    uuid: "550e8400-e29b-41d4-a716-446655440001",
    component: "button",
  },
  "font-size-large": {
    $schema:
      "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/dimension.json",
    value: "24px",
    uuid: "550e8400-e29b-41d4-a716-446655440002",
  },
};

const mockFigmaCollection: FigmaVariableCollection = {
  id: "collection-1",
  name: "Design Tokens",
  modes: [
    { modeId: "mode-1", name: "Light" },
    { modeId: "mode-2", name: "Dark" },
  ],
  defaultModeId: "mode-1",
  variableIds: ["var-1", "var-2"],
};

const mockFigmaVariable: FigmaVariable = {
  id: "var-1",
  name: "colors/primary/blue",
  resolvedType: "COLOR",
  valuesByMode: {
    "mode-1": { r: 0, g: 0.4, b: 0.8, a: 1 },
  },
  description: "Primary brand color",
  hiddenFromPublishing: false,
  scopes: ["ALL_SCOPES"],
  codeSyntax: {},
};

// ============================================================================
// File Generator Tests
// ============================================================================

test("generateDTCGFile creates valid JSON file", (t) => {
  const result = generateDTCGFile(mockDTCGTokens, defaultSettings);

  t.is(result.filename, "design-tokens.json");
  t.is(result.format, "dtcg");
  t.truthy(result.size > 0);

  // Parse and validate JSON
  const parsed = JSON.parse(result.content);
  t.truthy(parsed["primary-blue"]);
  t.is(parsed["primary-blue"].$type, "color");
  t.is(parsed["primary-blue"].$value.hex, "#0066CC");
});

test("generateDTCGFile uses collection name in filename", (t) => {
  const result = generateDTCGFile(
    mockDTCGTokens,
    defaultSettings,
    "My Collection",
  );

  t.is(result.filename, "my-collection-dtcg.json");
});

test("generateSpectrumFile creates valid JSON file", (t) => {
  const result = generateSpectrumFile(mockSpectrumTokens, defaultSettings);

  t.is(result.filename, "spectrum-tokens.json");
  t.is(result.format, "spectrum");
  t.truthy(result.size > 0);

  // Parse and validate JSON
  const parsed = JSON.parse(result.content);
  t.truthy(parsed["primary-blue"]);
  t.is(
    parsed["primary-blue"].$schema,
    "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
  );
  t.is(parsed["primary-blue"].value, "rgb(0, 102, 204)");
});

test("generateSpectrumFile uses collection name in filename", (t) => {
  const result = generateSpectrumFile(
    mockSpectrumTokens,
    defaultSettings,
    "Test Collection",
  );

  t.is(result.filename, "test-collection-spectrum.json");
});

test("generateReadme creates valid markdown", (t) => {
  const result = generateReadme({
    totalTokens: 42,
    collections: 3,
    exportDate: "2024-01-01T00:00:00.000Z",
    warnings: 5,
    errors: 0,
  });

  t.is(result.filename, "README.md");
  t.truthy(result.content.includes("# Exported Design Tokens"));
  t.truthy(result.content.includes("**Total Tokens:** 42"));
  t.truthy(result.content.includes("**Collections:** 3"));
  t.truthy(result.content.includes("**Warnings:** 5"));
  t.truthy(result.content.includes("**Errors:** 0"));
});

test("generateManifest creates valid manifest", (t) => {
  const files: ExportFile[] = [
    { filename: "tokens.json", content: "{}", format: "dtcg", size: 2 },
    { filename: "spectrum.json", content: "{}", format: "spectrum", size: 2 },
  ];

  const result = generateManifest(files, defaultSettings, {
    totalTokens: 10,
    collections: 1,
    warnings: ["Test warning"],
    errors: [],
  });

  t.is(result.filename, "export-manifest.json");
  t.truthy(result.size > 0);

  const parsed = JSON.parse(result.content);
  t.is(parsed.version, "1.0.0");
  t.is(parsed.statistics.totalTokens, 10);
  t.is(parsed.statistics.totalCollections, 1);
  t.is(parsed.statistics.totalFiles, 2);
  t.is(parsed.warnings.length, 1);
  t.is(parsed.errors.length, 0);
  t.is(parsed.files.length, 2);
});

test("formatFileSize formats bytes correctly", (t) => {
  t.is(formatFileSize(500), "500 B");
  t.is(formatFileSize(1024), "1.0 KB");
  t.is(formatFileSize(1536), "1.5 KB");
  t.is(formatFileSize(1048576), "1.0 MB");
  t.is(formatFileSize(2097152), "2.0 MB");
});

// ============================================================================
// Export Coordinator Tests
// ============================================================================

test("ExportCoordinator exports tokens successfully", async (t) => {
  const coordinator = new ExportCoordinator();

  const result = await coordinator.export(
    [mockFigmaCollection],
    [mockFigmaVariable],
    defaultSettings,
  );

  t.true(result.success);
  t.truthy(result.files.length >= 4); // DTCG + Spectrum + README + manifest
  t.truthy(result.statistics.totalTokens > 0);
  t.is(result.statistics.collections, 1);
  t.is(result.exportPath, "/exported-tokens/");
});

test("ExportCoordinator generates both DTCG and Spectrum files", async (t) => {
  const coordinator = new ExportCoordinator();

  const result = await coordinator.export(
    [mockFigmaCollection],
    [mockFigmaVariable],
    { ...defaultSettings, format: "both" },
  );

  const dtcgFile = result.files.find(
    (f) =>
      f.filename === "design-tokens.json" || f.filename.includes("-dtcg.json"),
  );
  const spectrumFile = result.files.find(
    (f) =>
      f.filename === "spectrum-tokens.json" ||
      (f.filename.includes("-spectrum.json") &&
        !f.filename.includes("manifest")),
  );

  t.truthy(dtcgFile, "DTCG file should be generated");
  t.truthy(spectrumFile, "Spectrum file should be generated");
});

test("ExportCoordinator generates only DTCG file when requested", async (t) => {
  const coordinator = new ExportCoordinator();

  const result = await coordinator.export(
    [mockFigmaCollection],
    [mockFigmaVariable],
    { ...defaultSettings, format: "dtcg" },
  );

  const dtcgFile = result.files.find(
    (f) =>
      f.filename === "design-tokens.json" || f.filename.includes("-dtcg.json"),
  );
  const spectrumFile = result.files.find(
    (f) =>
      f.filename === "spectrum-tokens.json" ||
      (f.filename.includes("-spectrum.json") &&
        !f.filename.includes("manifest")),
  );

  t.truthy(dtcgFile, "DTCG file should be generated");
  t.falsy(spectrumFile, "Spectrum file should NOT be generated");
});

test("ExportCoordinator generates only Spectrum file when requested", async (t) => {
  const coordinator = new ExportCoordinator();

  const result = await coordinator.export(
    [mockFigmaCollection],
    [mockFigmaVariable],
    { ...defaultSettings, format: "spectrum" },
  );

  const dtcgFile = result.files.find(
    (f) =>
      f.filename === "design-tokens.json" || f.filename.includes("-dtcg.json"),
  );
  const spectrumFile = result.files.find(
    (f) =>
      f.filename === "spectrum-tokens.json" ||
      (f.filename.includes("-spectrum.json") &&
        !f.filename.includes("manifest")),
  );

  t.falsy(dtcgFile, "DTCG file should NOT be generated");
  t.truthy(spectrumFile, "Spectrum file should be generated");
});

test("ExportCoordinator tracks progress through all stages", async (t) => {
  const progressUpdates: ExportProgress[] = [];

  const coordinator = new ExportCoordinator((progress) => {
    progressUpdates.push(progress);
  });

  await coordinator.export(
    [mockFigmaCollection],
    [mockFigmaVariable],
    defaultSettings,
  );

  // Should have progress updates for: scanning, converting, generating (multiple), complete
  t.truthy(progressUpdates.length > 0);

  // Check for all stages
  const stages = progressUpdates.map((p) => p.stage);
  t.truthy(stages.includes("scanning"));
  t.truthy(stages.includes("converting"));
  t.truthy(stages.includes("generating"));
  t.truthy(stages.includes("complete"));

  // Final progress should be 100%
  const finalProgress = progressUpdates[progressUpdates.length - 1];
  if (finalProgress) {
    t.is(finalProgress.percentage, 100);
  }
});

test("ExportCoordinator calculates statistics correctly", async (t) => {
  const coordinator = new ExportCoordinator();

  const multipleVariables: FigmaVariable[] = [
    { ...mockFigmaVariable, id: "var-1", name: "color-1" },
    { ...mockFigmaVariable, id: "var-2", name: "color-2" },
    { ...mockFigmaVariable, id: "var-3", name: "color-3" },
  ];

  const result = await coordinator.export(
    [mockFigmaCollection],
    multipleVariables,
    defaultSettings,
  );

  t.is(result.statistics.totalTokens, 3);
  t.is(result.statistics.collections, 1);
  t.truthy(result.statistics.totalSize > 0);
  t.truthy(result.statistics.totalFiles >= 4);
});

test("ExportCoordinator handles empty variable list", async (t) => {
  const coordinator = new ExportCoordinator();

  const result = await coordinator.export(
    [mockFigmaCollection],
    [],
    defaultSettings,
  );

  t.true(result.success);
  t.is(result.statistics.totalTokens, 0);
  t.truthy(result.files.length > 0); // Should still generate README and manifest
});

test("exportTokens convenience function works", async (t) => {
  const result = await exportTokens(
    [mockFigmaCollection],
    [mockFigmaVariable],
    defaultSettings,
  );

  t.true(result.success);
  t.truthy(result.files.length > 0);
  t.truthy(result.statistics.totalTokens > 0);
});

test("exportTokens passes progress callback correctly", async (t) => {
  let progressCallbackCalled = false;

  await exportTokens(
    [mockFigmaCollection],
    [mockFigmaVariable],
    defaultSettings,
    (progress) => {
      progressCallbackCalled = true;
      t.truthy(progress.stage);
      t.truthy(progress.message);
    },
  );

  t.true(progressCallbackCalled);
});

test("ExportCoordinator formatSummary generates readable output", (t) => {
  const mockResult = {
    success: true,
    files: [
      {
        filename: "tokens.json",
        content: "{}",
        format: "dtcg" as const,
        size: 100,
      },
    ],
    statistics: {
      totalTokens: 42,
      totalFiles: 4,
      totalSize: 1024,
      collections: 2,
      warnings: 1,
      errors: 0,
    },
    warnings: ["Test warning"],
    errors: [],
    exportPath: "/exported-tokens/",
  };

  const summary = ExportCoordinator.formatSummary(mockResult);

  t.truthy(summary.includes("EXPORT SUMMARY"));
  t.truthy(summary.includes("Export completed successfully"));
  t.truthy(summary.includes("Tokens exported: 42"));
  t.truthy(summary.includes("Files generated: 4"));
  t.truthy(summary.includes("Collections: 2"));
  t.truthy(summary.includes("Test warning"));
  t.truthy(summary.includes("/exported-tokens/"));
});

// ============================================================================
// Integration Test
// ============================================================================

test("End-to-end export with multiple collections and variables", async (t) => {
  const collections: FigmaVariableCollection[] = [
    { ...mockFigmaCollection, id: "col-1", name: "Colors" },
    { ...mockFigmaCollection, id: "col-2", name: "Sizes" },
  ];

  const variables: FigmaVariable[] = [
    { ...mockFigmaVariable, id: "var-1", name: "color/primary" },
    { ...mockFigmaVariable, id: "var-2", name: "color/secondary" },
    {
      ...mockFigmaVariable,
      id: "var-3",
      name: "size/large",
      resolvedType: "FLOAT",
      valuesByMode: { "mode-1": 24 },
    },
  ];

  const coordinator = new ExportCoordinator();
  const result = await coordinator.export(
    collections,
    variables,
    defaultSettings,
  );

  t.true(result.success);
  t.is(result.statistics.totalTokens, 3);
  t.is(result.statistics.collections, 2);
  t.truthy(result.files.length >= 4);

  // Verify all files have content
  for (const file of result.files) {
    t.truthy(file.filename);
    t.truthy(file.content);
    t.truthy(file.size > 0);
  }
});
