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
 * Tests for validation utilities
 */

import test from "ava";
import type {
  DesignToken,
  SpectrumToken,
  ExportSettings,
  FigmaVariable,
} from "../src/shared/types";
import {
  isValidRGB,
  isValidRGBA,
  isValidHexColor,
  isValidDimension,
  isValidOpacity,
  isValidFontWeight,
  isValidMultiplier,
  isValidAlias,
  validateDTCGToken,
  validateSpectrumToken,
  validateTokenValue,
  validateExportSettings,
  validateFigmaVariable,
  validateVariableValue,
  validateTokens,
  formatValidationReport,
} from "../src/utils/validators";

// ============================================================================
// Value Validators Tests
// ============================================================================

test("isValidRGB validates RGB color values", (t) => {
  // Valid RGB
  t.true(isValidRGB({ r: 0, g: 0.5, b: 1 }));
  t.true(isValidRGB({ r: 0, g: 0, b: 0 }));
  t.true(isValidRGB({ r: 1, g: 1, b: 1 }));

  // Invalid RGB
  t.false(isValidRGB({ r: -1, g: 0.5, b: 1 })); // negative
  t.false(isValidRGB({ r: 0, g: 2, b: 1 })); // out of range
  t.false(isValidRGB({ r: "red", g: 0.5, b: 1 })); // wrong type
  t.false(isValidRGB(null));
  t.false(isValidRGB(undefined));
  t.false(isValidRGB("rgb(0,0,0)"));
});

test("isValidRGBA validates RGBA color values", (t) => {
  // Valid RGBA
  t.true(isValidRGBA({ r: 0, g: 0.5, b: 1, a: 0.5 }));
  t.true(isValidRGBA({ r: 0, g: 0, b: 0, a: 1 }));

  // Invalid RGBA
  t.false(isValidRGBA({ r: 0, g: 0.5, b: 1 })); // missing alpha
  t.false(isValidRGBA({ r: 0, g: 0.5, b: 1, a: 2 })); // alpha out of range
  t.false(isValidRGBA({ r: 0, g: 0.5, b: 1, a: -0.5 })); // negative alpha
});

test("isValidHexColor validates hex color strings", (t) => {
  // Valid hex colors
  t.true(isValidHexColor("#FF0000"));
  t.true(isValidHexColor("#ff0000"));
  t.true(isValidHexColor("#FF0000FF")); // 8-char with alpha
  t.true(isValidHexColor("#ABC")); // 3-char shorthand
  t.true(isValidHexColor("#FF00")); // 4-char RGBA shorthand

  // Invalid hex colors
  t.false(isValidHexColor("FF0000")); // missing #
  t.false(isValidHexColor("#FG0000")); // invalid character
  t.false(isValidHexColor("#FF000")); // wrong length (5 chars)
  t.false(isValidHexColor("rgb(255,0,0)"));
});

test("isValidDimension validates dimension values", (t) => {
  // Valid dimensions
  t.true(isValidDimension(16));
  t.true(isValidDimension(0));
  t.true(isValidDimension("16px"));
  t.true(isValidDimension("1.5rem"));
  t.true(isValidDimension("2em"));
  t.true(isValidDimension("100%"));

  // Invalid dimensions
  t.false(isValidDimension(-16)); // negative
  t.false(isValidDimension(NaN));
  t.false(isValidDimension(Infinity));
  t.false(isValidDimension("16")); // missing unit
  t.false(isValidDimension("16pt")); // unsupported unit
});

test("isValidOpacity validates opacity values", (t) => {
  // Valid opacity
  t.true(isValidOpacity(0));
  t.true(isValidOpacity(0.5));
  t.true(isValidOpacity(1));

  // Invalid opacity
  t.false(isValidOpacity(-0.1));
  t.false(isValidOpacity(1.1));
  t.false(isValidOpacity(NaN));
  t.false(isValidOpacity(Infinity));
  t.false(isValidOpacity("0.5"));
});

test("isValidFontWeight validates font weight values", (t) => {
  // Valid font weights
  t.true(isValidFontWeight(100));
  t.true(isValidFontWeight(400));
  t.true(isValidFontWeight(700));
  t.true(isValidFontWeight(900));
  t.true(isValidFontWeight("normal"));
  t.true(isValidFontWeight("bold"));
  t.true(isValidFontWeight("400"));

  // Invalid font weights
  t.false(isValidFontWeight(150)); // not multiple of 100
  t.false(isValidFontWeight(1000)); // out of range
  t.false(isValidFontWeight(50)); // too small
  t.false(isValidFontWeight("heavy")); // invalid keyword
  t.false(isValidFontWeight(NaN));
});

test("isValidMultiplier validates multiplier values", (t) => {
  // Valid multipliers
  t.true(isValidMultiplier(0));
  t.true(isValidMultiplier(1));
  t.true(isValidMultiplier(1.5));
  t.true(isValidMultiplier(100));

  // Invalid multipliers
  t.false(isValidMultiplier(-1));
  t.false(isValidMultiplier(NaN));
  t.false(isValidMultiplier(Infinity));
  t.false(isValidMultiplier("1.5"));
});

test("isValidAlias validates alias references", (t) => {
  // Valid aliases
  t.true(isValidAlias("{color.primary}"));
  t.true(isValidAlias("{tokens/color/primary}"));
  t.true(isValidAlias("{token-name}"));

  // Invalid aliases
  t.false(isValidAlias("color.primary")); // missing braces
  t.false(isValidAlias("{color primary}")); // space not allowed
  t.false(isValidAlias("{}")); // empty
  t.false(isValidAlias("{{nested}}")); // nested braces
});

// ============================================================================
// Token Structure Validators Tests
// ============================================================================

test("validateDTCGToken validates valid DTCG tokens", (t) => {
  const token: DesignToken = {
    $value: "#FF0000",
    $type: "color",
    $description: "Primary color",
  };

  const result = validateDTCGToken("primary-color", token);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test("validateDTCGToken detects missing $value", (t) => {
  const token = {
    $type: "color",
  } as DesignToken;

  const result = validateDTCGToken("test", token);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "MISSING_VALUE"));
});

test("validateDTCGToken warns about unknown types", (t) => {
  const token: DesignToken = {
    $value: "16px",
    $type: "unknownType" as any,
  };

  const result = validateDTCGToken("test", token);
  t.truthy(result.warnings.find((w) => w.code === "UNKNOWN_TYPE"));
});

test("validateDTCGToken warns about long descriptions", (t) => {
  const token: DesignToken = {
    $value: "#FF0000",
    $type: "color",
    $description: "a".repeat(600),
  };

  const result = validateDTCGToken("test", token);
  t.truthy(result.warnings.find((w) => w.code === "LONG_DESCRIPTION"));
});

test("validateSpectrumToken validates valid Spectrum tokens", (t) => {
  const token: SpectrumToken = {
    $schema:
      "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    value: "rgb(255, 0, 0)",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
  };

  const result = validateSpectrumToken("primary-color", token);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test("validateSpectrumToken detects missing required properties", (t) => {
  const token = {
    value: "rgb(255, 0, 0)",
  } as SpectrumToken;

  const result = validateSpectrumToken("test", token);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "MISSING_SCHEMA"));
  t.truthy(result.errors.find((e) => e.code === "MISSING_UUID"));
});

test("validateSpectrumToken detects invalid UUID format", (t) => {
  const token: SpectrumToken = {
    $schema:
      "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    value: "rgb(255, 0, 0)",
    uuid: "invalid-uuid",
  };

  const result = validateSpectrumToken("test", token);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "INVALID_UUID"));
});

test("validateSpectrumToken warns about non-standard schema URLs", (t) => {
  const token: SpectrumToken = {
    $schema: "https://example.com/schema.json",
    value: "rgb(255, 0, 0)",
    uuid: "550e8400-e29b-41d4-a716-446655440000",
  };

  const result = validateSpectrumToken("test", token);
  t.truthy(result.warnings.find((w) => w.code === "INVALID_SCHEMA_URL"));
});

// ============================================================================
// Token Value Validators Tests
// ============================================================================

test("validateTokenValue validates color values", (t) => {
  const validRgb = validateTokenValue("color", { r: 1, g: 0, b: 0, a: 1 });
  t.true(validRgb.valid);

  const validHex = validateTokenValue("color", "#FF0000");
  t.true(validHex.valid);

  const invalidColor = validateTokenValue("color", "red");
  t.false(invalidColor.valid);
});

test("validateTokenValue validates dimension values", (t) => {
  const validNumber = validateTokenValue("dimension", 16);
  t.true(validNumber.valid);

  const validString = validateTokenValue("dimension", "16px");
  t.true(validString.valid);

  const invalidNegative = validateTokenValue("dimension", -16);
  t.false(invalidNegative.valid);
});

test("validateTokenValue validates opacity values", (t) => {
  const valid = validateTokenValue("opacity", 0.5);
  t.true(valid.valid);

  const invalid = validateTokenValue("opacity", 1.5);
  t.false(invalid.valid);
});

test("validateTokenValue validates fontWeight values", (t) => {
  const validNumber = validateTokenValue("fontWeight", 700);
  t.true(validNumber.valid);

  const validString = validateTokenValue("fontWeight", "bold");
  t.true(validString.valid);

  const invalid = validateTokenValue("fontWeight", 750);
  t.false(invalid.valid);
});

// ============================================================================
// Settings Validators Tests
// ============================================================================

test("validateExportSettings validates valid settings", (t) => {
  const settings: ExportSettings = {
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

  const result = validateExportSettings(settings);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test("validateExportSettings detects invalid format", (t) => {
  const settings = {
    format: "invalid",
    structure: "nested",
  } as any;

  const result = validateExportSettings(settings);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "INVALID_FORMAT"));
});

test("validateExportSettings detects invalid structure", (t) => {
  const settings = {
    format: "dtcg",
    structure: "invalid",
  } as any;

  const result = validateExportSettings(settings);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "INVALID_STRUCTURE"));
});

test("validateExportSettings warns about unknown naming convention", (t) => {
  const settings: ExportSettings = {
    format: "dtcg",
    structure: "nested",
    fileOrganization: "single",
    includePrivate: false,
    includeDeprecated: false,
    namingConvention: "custom" as any,
    defaultUnit: "px",
    modeHandling: "auto",
    includeMetadata: true,
    generateUUIDs: "deterministic",
  };

  const result = validateExportSettings(settings);
  t.truthy(result.warnings.find((w) => w.code === "INVALID_NAMING_CONVENTION"));
});

// ============================================================================
// Figma Variable Validators Tests
// ============================================================================

test("validateFigmaVariable validates valid variables", (t) => {
  const variable: FigmaVariable = {
    id: "var-1",
    name: "color/primary",
    resolvedType: "COLOR",
    valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
    description: "Primary color",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = validateFigmaVariable(variable);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test("validateFigmaVariable detects missing required properties", (t) => {
  const variable = {
    name: "test",
  } as any;

  const result = validateFigmaVariable(variable);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "MISSING_ID"));
});

test("validateFigmaVariable detects invalid type", (t) => {
  const variable: FigmaVariable = {
    id: "var-1",
    name: "test",
    resolvedType: "INVALID" as any,
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: [],
    codeSyntax: {},
  };

  const result = validateFigmaVariable(variable);
  t.false(result.valid);
  t.truthy(result.errors.find((e) => e.code === "INVALID_TYPE"));
});

test("validateFigmaVariable warns about empty values", (t) => {
  const variable: FigmaVariable = {
    id: "var-1",
    name: "test",
    resolvedType: "COLOR",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: [],
    codeSyntax: {},
  };

  const result = validateFigmaVariable(variable);
  t.truthy(result.warnings.find((w) => w.code === "NO_VALUES"));
});

test("validateFigmaVariable warns about invalid name characters", (t) => {
  const variable: FigmaVariable = {
    id: "var-1",
    name: "color:primary",
    resolvedType: "COLOR",
    valuesByMode: { "mode-1": { r: 1, g: 0, b: 0, a: 1 } },
    description: "",
    hiddenFromPublishing: false,
    scopes: [],
    codeSyntax: {},
  };

  const result = validateFigmaVariable(variable);
  t.truthy(result.warnings.find((w) => w.code === "INVALID_NAME_CHARACTERS"));
});

// ============================================================================
// Batch Validation Tests
// ============================================================================

test("validateTokens validates multiple DTCG tokens", (t) => {
  const tokens: Record<string, DesignToken> = {
    "color-1": { $value: "#FF0000", $type: "color" },
    "color-2": { $value: "#00FF00", $type: "color" },
  };

  const result = validateTokens(tokens, "dtcg");
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test("validateTokens collects errors from multiple tokens", (t) => {
  const tokens: Record<string, DesignToken> = {
    "token-1": { $type: "color" } as DesignToken, // missing $value
    "token-2": { $type: "color" } as DesignToken, // missing $value
  };

  const result = validateTokens(tokens, "dtcg");
  t.false(result.valid);
  t.is(result.errors.length, 2);
});

// ============================================================================
// Validation Report Tests
// ============================================================================

test("formatValidationReport formats successful validation", (t) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
  };

  const report = formatValidationReport(result);
  t.truthy(report.includes("✅ Validation passed"));
});

test("formatValidationReport formats errors", (t) => {
  const result = {
    valid: false,
    errors: [{ code: "TEST_ERROR", message: "Test error message" }],
    warnings: [],
  };

  const report = formatValidationReport(result);
  t.truthy(report.includes("❌ Validation failed"));
  t.truthy(report.includes("TEST_ERROR"));
  t.truthy(report.includes("Test error message"));
});

test("formatValidationReport formats warnings", (t) => {
  const result = {
    valid: true,
    errors: [],
    warnings: [
      {
        code: "TEST_WARNING",
        message: "Test warning message",
        suggestion: "Fix this",
      },
    ],
  };

  const report = formatValidationReport(result);
  t.truthy(report.includes("⚠️"));
  t.truthy(report.includes("TEST_WARNING"));
  t.truthy(report.includes("Test warning message"));
  t.truthy(report.includes("Fix this"));
});
