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
 * Validation utilities for tokens, settings, and data
 */

import type {
  DesignToken,
  SpectrumToken,
  ExportSettings,
  FigmaVariable,
  RGB,
  RGBA,
  VariableValue,
} from "../shared/types";
import { isVariableAlias } from "../shared/types";

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  value?: unknown;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  suggestion?: string;
}

// ============================================================================
// Token Value Validators
// ============================================================================

/**
 * Validate RGB color value
 */
export function isValidRGB(value: unknown): value is RGB {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const rgb = value as Record<string, unknown>;

  return (
    typeof rgb.r === "number" &&
    typeof rgb.g === "number" &&
    typeof rgb.b === "number" &&
    rgb.r >= 0 &&
    rgb.r <= 1 &&
    rgb.g >= 0 &&
    rgb.g <= 1 &&
    rgb.b >= 0 &&
    rgb.b <= 1
  );
}

/**
 * Validate RGBA color value
 */
export function isValidRGBA(value: unknown): value is RGBA {
  if (!isValidRGB(value)) {
    return false;
  }

  const rgba = value as Record<string, unknown>;

  return typeof rgba.a === "number" && rgba.a >= 0 && rgba.a <= 1;
}

/**
 * Validate hex color string
 */
export function isValidHexColor(value: string): boolean {
  // Support #RGB, #RGBA, #RRGGBB, #RRGGBBAA formats
  return /^#([0-9A-F]{3}|[0-9A-F]{4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(value);
}

/**
 * Validate dimension value
 */
export function isValidDimension(value: unknown): boolean {
  if (typeof value === "number") {
    return !isNaN(value) && isFinite(value) && value >= 0;
  }

  if (typeof value === "string") {
    // Valid dimension strings: "16px", "1rem", "2em", "100%"
    return /^\d+(\.\d+)?(px|rem|em|%)$/.test(value);
  }

  return false;
}

/**
 * Validate opacity value
 */
export function isValidOpacity(value: unknown): boolean {
  if (typeof value !== "number") {
    return false;
  }

  return !isNaN(value) && isFinite(value) && value >= 0 && value <= 1;
}

/**
 * Validate font weight value
 */
export function isValidFontWeight(value: unknown): boolean {
  if (typeof value === "number") {
    // CSS font weights: 100-900 in steps of 100
    return (
      !isNaN(value) &&
      isFinite(value) &&
      value >= 100 &&
      value <= 900 &&
      value % 100 === 0
    );
  }

  if (typeof value === "string") {
    const validKeywords = [
      "normal",
      "bold",
      "bolder",
      "lighter",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "700",
      "800",
      "900",
    ];
    return validKeywords.includes(value);
  }

  return false;
}

/**
 * Validate multiplier value
 */
export function isValidMultiplier(value: unknown): boolean {
  if (typeof value !== "number") {
    return false;
  }

  return !isNaN(value) && isFinite(value) && value >= 0;
}

/**
 * Validate alias reference
 */
export function isValidAlias(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  // Valid alias format: {token.name} or {token/path/name}
  return /^\{[a-zA-Z0-9._/-]+\}$/.test(value);
}

// ============================================================================
// Token Structure Validators
// ============================================================================

/**
 * Validate DTCG token structure
 */
export function validateDTCGToken(
  tokenName: string,
  token: DesignToken,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required $value property
  if (token.$value === undefined) {
    errors.push({
      code: "MISSING_VALUE",
      message: `Token "${tokenName}" is missing required $value property`,
      path: tokenName,
    });
  }

  // Validate token type if specified
  if (token.$type) {
    const validTypes = [
      "color",
      "dimension",
      "fontFamily",
      "fontWeight",
      "duration",
      "cubicBezier",
      "number",
      "string",
    ];

    if (!validTypes.includes(token.$type)) {
      warnings.push({
        code: "UNKNOWN_TYPE",
        message: `Token "${tokenName}" has unknown type "${token.$type}"`,
        path: tokenName,
        suggestion: `Valid types: ${validTypes.join(", ")}`,
      });
    }
  }

  // Validate value based on type
  if (token.$type && token.$value !== undefined) {
    const valueValid = validateTokenValue(token.$type, token.$value);
    if (!valueValid.valid) {
      errors.push(...valueValid.errors);
      warnings.push(...valueValid.warnings);
    }
  }

  // Check for circular references in descriptions
  if (token.$description && token.$description.length > 500) {
    warnings.push({
      code: "LONG_DESCRIPTION",
      message: `Token "${tokenName}" has a very long description (${token.$description.length} chars)`,
      path: tokenName,
      suggestion: "Consider shortening the description for better readability",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Spectrum token structure
 */
export function validateSpectrumToken(
  tokenName: string,
  token: SpectrumToken,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required properties
  if (!token.$schema) {
    errors.push({
      code: "MISSING_SCHEMA",
      message: `Token "${tokenName}" is missing required $schema property`,
      path: tokenName,
    });
  }

  if (token.value === undefined) {
    errors.push({
      code: "MISSING_VALUE",
      message: `Token "${tokenName}" is missing required value property`,
      path: tokenName,
    });
  }

  if (!token.uuid) {
    errors.push({
      code: "MISSING_UUID",
      message: `Token "${tokenName}" is missing required uuid property`,
      path: tokenName,
    });
  }

  // Validate schema URL format
  if (token.$schema) {
    const schemaPattern =
      /^https:\/\/opensource\.adobe\.com\/spectrum-tokens\/schemas\//;
    if (!schemaPattern.test(token.$schema)) {
      warnings.push({
        code: "INVALID_SCHEMA_URL",
        message: `Token "${tokenName}" has non-standard schema URL`,
        path: tokenName,
        suggestion:
          "Schema should point to opensource.adobe.com/spectrum-tokens/schemas/",
      });
    }
  }

  // Validate UUID format (basic check)
  if (token.uuid) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(token.uuid)) {
      errors.push({
        code: "INVALID_UUID",
        message: `Token "${tokenName}" has invalid UUID format`,
        path: tokenName,
        value: token.uuid,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate token value based on type
 */
export function validateTokenValue(
  type: string,
  value: unknown,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  switch (type) {
    case "color":
      if (typeof value === "object" && value !== null) {
        if (!isValidRGB(value) && !isValidRGBA(value)) {
          errors.push({
            code: "INVALID_COLOR",
            message: "Color value must be a valid RGB or RGBA object",
            value,
          });
        }
      } else if (typeof value === "string") {
        if (!isValidHexColor(value) && !isValidAlias(value)) {
          errors.push({
            code: "INVALID_COLOR",
            message: "Color value must be a valid hex color or alias reference",
            value,
          });
        }
      } else {
        errors.push({
          code: "INVALID_COLOR",
          message: "Color value must be an object or string",
          value,
        });
      }
      break;

    case "dimension":
      if (!isValidDimension(value)) {
        errors.push({
          code: "INVALID_DIMENSION",
          message:
            "Dimension value must be a positive number or string with unit (px, rem, em, %)",
          value,
        });
      }
      break;

    case "opacity":
      if (!isValidOpacity(value)) {
        errors.push({
          code: "INVALID_OPACITY",
          message: "Opacity value must be a number between 0 and 1",
          value,
        });
      }
      break;

    case "fontWeight":
      if (!isValidFontWeight(value)) {
        errors.push({
          code: "INVALID_FONT_WEIGHT",
          message:
            "Font weight must be 100-900 (in steps of 100) or a valid keyword",
          value,
        });
      }
      break;

    case "multiplier":
    case "number":
      if (!isValidMultiplier(value)) {
        errors.push({
          code: "INVALID_NUMBER",
          message: "Multiplier/number value must be a positive finite number",
          value,
        });
      }
      break;

    case "fontFamily":
    case "string":
      if (typeof value !== "string") {
        errors.push({
          code: "INVALID_STRING",
          message: `${type} value must be a string`,
          value,
        });
      }
      break;

    default:
      warnings.push({
        code: "UNKNOWN_TYPE",
        message: `Unknown token type "${type}", skipping value validation`,
      });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Settings Validators
// ============================================================================

/**
 * Validate export settings
 */
export function validateExportSettings(
  settings: ExportSettings,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate format
  const validFormats = ["dtcg", "spectrum", "both"];
  if (!validFormats.includes(settings.format)) {
    errors.push({
      code: "INVALID_FORMAT",
      message: `Invalid format "${settings.format}". Must be one of: ${validFormats.join(", ")}`,
      path: "format",
      value: settings.format,
    });
  }

  // Validate structure
  const validStructures = ["flat", "nested"];
  if (!validStructures.includes(settings.structure)) {
    errors.push({
      code: "INVALID_STRUCTURE",
      message: `Invalid structure "${settings.structure}". Must be one of: ${validStructures.join(", ")}`,
      path: "structure",
      value: settings.structure,
    });
  }

  // Validate naming convention
  const validNamingConventions = [
    "kebab-case",
    "camelCase",
    "snake_case",
    "original",
  ];
  if (!validNamingConventions.includes(settings.namingConvention)) {
    warnings.push({
      code: "INVALID_NAMING_CONVENTION",
      message: `Unknown naming convention "${settings.namingConvention}"`,
      path: "namingConvention",
      suggestion: `Valid conventions: ${validNamingConventions.join(", ")}`,
    });
  }

  // Validate default unit
  const validUnits = ["px", "rem"];
  if (!validUnits.includes(settings.defaultUnit)) {
    warnings.push({
      code: "INVALID_DEFAULT_UNIT",
      message: `Unknown default unit "${settings.defaultUnit}"`,
      path: "defaultUnit",
      suggestion: `Valid units: ${validUnits.join(", ")}`,
    });
  }

  // Validate UUID generation mode
  const validUUIDModes = ["deterministic", "random", "none"];
  if (!validUUIDModes.includes(settings.generateUUIDs)) {
    warnings.push({
      code: "INVALID_UUID_MODE",
      message: `Unknown UUID generation mode "${settings.generateUUIDs}"`,
      path: "generateUUIDs",
      suggestion: `Valid modes: ${validUUIDModes.join(", ")}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Figma Variable Validators
// ============================================================================

/**
 * Validate Figma variable
 */
export function validateFigmaVariable(
  variable: FigmaVariable,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check required properties
  if (!variable.id) {
    errors.push({
      code: "MISSING_ID",
      message: "Variable is missing required id property",
    });
  }

  if (!variable.name) {
    errors.push({
      code: "MISSING_NAME",
      message: "Variable is missing required name property",
    });
  }

  if (!variable.resolvedType) {
    errors.push({
      code: "MISSING_TYPE",
      message: `Variable "${variable.name}" is missing required resolvedType property`,
    });
  }

  // Validate resolved type
  const validTypes = ["COLOR", "FLOAT", "STRING", "BOOLEAN"];
  if (variable.resolvedType && !validTypes.includes(variable.resolvedType)) {
    errors.push({
      code: "INVALID_TYPE",
      message: `Variable "${variable.name}" has invalid type "${variable.resolvedType}"`,
      value: variable.resolvedType,
    });
  }

  // Check if variable has values
  if (
    !variable.valuesByMode ||
    Object.keys(variable.valuesByMode).length === 0
  ) {
    warnings.push({
      code: "NO_VALUES",
      message: `Variable "${variable.name}" has no values defined`,
      suggestion: "Variable will be skipped during export",
    });
  }

  // Validate variable name format
  if (variable.name && /[<>:"|?*]/.test(variable.name)) {
    warnings.push({
      code: "INVALID_NAME_CHARACTERS",
      message: `Variable "${variable.name}" contains characters that may cause issues in file systems`,
      suggestion: "Consider renaming to avoid special characters",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate variable value for a specific mode
 */
export function validateVariableValue(
  variable: FigmaVariable,
  modeId: string,
  value: VariableValue,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check if value exists for mode
  if (value === undefined || value === null) {
    warnings.push({
      code: "MISSING_MODE_VALUE",
      message: `Variable "${variable.name}" has no value for mode "${modeId}"`,
    });
    return { valid: true, errors, warnings };
  }

  // Skip validation for alias references - they're always valid
  if (isVariableAlias(value)) {
    return { valid: true, errors, warnings };
  }

  // Validate value based on variable type
  switch (variable.resolvedType) {
    case "COLOR":
      if (
        typeof value === "object" &&
        !isValidRGB(value) &&
        !isValidRGBA(value)
      ) {
        errors.push({
          code: "INVALID_COLOR_VALUE",
          message: `Variable "${variable.name}" has invalid color value`,
          value,
        });
      }
      break;

    case "FLOAT":
      if (typeof value === "number" && (!isFinite(value) || isNaN(value))) {
        errors.push({
          code: "INVALID_FLOAT_VALUE",
          message: `Variable "${variable.name}" has invalid float value (NaN or Infinity)`,
          value,
        });
      }
      break;

    case "STRING":
      if (typeof value !== "string" && typeof value !== "object") {
        errors.push({
          code: "INVALID_STRING_VALUE",
          message: `Variable "${variable.name}" has invalid string value`,
          value,
        });
      }
      break;

    case "BOOLEAN":
      if (typeof value !== "boolean") {
        errors.push({
          code: "INVALID_BOOLEAN_VALUE",
          message: `Variable "${variable.name}" has invalid boolean value`,
          value,
        });
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple tokens at once
 */
export function validateTokens(
  tokens: Record<string, DesignToken | SpectrumToken>,
  format: "dtcg" | "spectrum",
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [name, token] of Object.entries(tokens)) {
    const result =
      format === "dtcg"
        ? validateDTCGToken(name, token as DesignToken)
        : validateSpectrumToken(name, token as SpectrumToken);

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create a human-readable validation report
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid && result.warnings.length === 0) {
    lines.push("✅ Validation passed with no issues");
    return lines.join("\n");
  }

  if (result.errors.length > 0) {
    lines.push(`❌ Validation failed with ${result.errors.length} error(s):`);
    lines.push("");
    for (const error of result.errors) {
      lines.push(`  [${error.code}] ${error.message}`);
      if (error.path) {
        lines.push(`    Path: ${error.path}`);
      }
      if (error.value !== undefined) {
        lines.push(`    Value: ${JSON.stringify(error.value)}`);
      }
    }
  }

  if (result.warnings.length > 0) {
    if (result.errors.length > 0) {
      lines.push("");
    }
    lines.push(`⚠️  ${result.warnings.length} warning(s):`);
    lines.push("");
    for (const warning of result.warnings) {
      lines.push(`  [${warning.code}] ${warning.message}`);
      if (warning.path) {
        lines.push(`    Path: ${warning.path}`);
      }
      if (warning.suggestion) {
        lines.push(`    Suggestion: ${warning.suggestion}`);
      }
    }
  }

  return lines.join("\n");
}
