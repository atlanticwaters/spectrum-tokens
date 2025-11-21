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
 * Value Transformation
 * Converts Figma variable values to Design Tokens format
 */

import type {
  VariableValue,
  RGB,
  RGBA,
  ColorValue,
  DimensionValue,
  TokenValue,
  VariableAlias,
} from "../shared/types";
import { isRGB, isRGBA, isVariableAlias } from "../shared/types";
import { extractUnit, extractNumericValue } from "./typeDetector";

/**
 * Clamp a number between min and max
 */
function clamp(value: number, min: number, max: number): number {
  if (!isFinite(value) || isNaN(value)) {
    return min; // Default to min for invalid values
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Transform Figma COLOR to DTCG color value
 */
export function transformColor(
  value: RGB | RGBA,
): ColorValue & { hex: string } {
  // Edge case: Clamp color components to valid range [0, 1]
  const rClamped = clamp(value.r, 0, 1);
  const gClamped = clamp(value.g, 0, 1);
  const bClamped = clamp(value.b, 0, 1);

  const r = Math.round(rClamped * 255);
  const g = Math.round(gClamped * 255);
  const b = Math.round(bClamped * 255);

  const hex =
    `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

  const color: ColorValue & { hex: string } = {
    colorSpace: "srgb",
    components: [rClamped, gClamped, bClamped],
    hex,
  };

  if (isRGBA(value)) {
    const alphaClamped = clamp(value.a, 0, 1);
    if (alphaClamped < 1) {
      color.alpha = alphaClamped;
    }
  }

  return color;
}

/**
 * Transform Figma COLOR to Spectrum rgb/rgba string
 */
export function transformColorToSpectrum(value: RGB | RGBA): string {
  // Edge case: Clamp color components to valid range [0, 1]
  const rClamped = clamp(value.r, 0, 1);
  const gClamped = clamp(value.g, 0, 1);
  const bClamped = clamp(value.b, 0, 1);

  const r = Math.round(rClamped * 255);
  const g = Math.round(gClamped * 255);
  const b = Math.round(bClamped * 255);

  if (isRGBA(value)) {
    const alphaClamped = clamp(value.a, 0, 1);
    if (alphaClamped < 1) {
      return `rgba(${r}, ${g}, ${b}, ${alphaClamped})`;
    }
  }

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Transform Figma FLOAT to DTCG dimension value
 */
export function transformDimension(
  value: number,
  defaultUnit: "px" | "rem" = "px",
): DimensionValue {
  // Edge case: Handle NaN and Infinity
  let safeValue = value;
  if (!isFinite(value) || isNaN(value)) {
    safeValue = 0; // Default to 0 for invalid values
  }
  // Edge case: Clamp negative dimensions to 0 (dimensions are typically positive)
  if (safeValue < 0) {
    safeValue = Math.abs(safeValue);
  }

  return {
    value: safeValue,
    unit: defaultUnit,
  };
}

/**
 * Transform Figma FLOAT to Spectrum dimension string
 */
export function transformDimensionToSpectrum(
  value: number,
  defaultUnit: "px" | "rem" = "px",
): string {
  return `${value}${defaultUnit}`;
}

/**
 * Transform Figma STRING dimension to DTCG dimension value
 * Handles strings like "16px", "1.5rem", etc.
 */
export function transformStringDimension(value: string): DimensionValue | null {
  const unit = extractUnit(value);
  const numericValue = extractNumericValue(value);

  if (unit && numericValue !== null) {
    return {
      value: numericValue,
      unit: unit as "px" | "rem" | "em" | "%",
    };
  }

  return null;
}

/**
 * Transform opacity (0-1 value) to string for Spectrum
 */
export function transformOpacity(value: number): string {
  return value.toString();
}

/**
 * Transform font weight number to Spectrum keyword
 */
export function transformFontWeight(value: number): string {
  if (value <= 200) return "light";
  if (value <= 400) return "regular";
  if (value <= 500) return "medium";
  if (value <= 700) return "bold";
  if (value <= 900) return "extra-bold";
  return "black";
}

/**
 * Transform font weight string to number
 */
export function transformFontWeightToNumber(value: string): number {
  const weightMap: Record<string, number> = {
    thin: 100,
    light: 300,
    regular: 400,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };

  return weightMap[value.toLowerCase()] ?? 400;
}

/**
 * Transform boolean to number (0 or 1)
 */
export function transformBoolean(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Normalize a token name to kebab-case
 * Handles camelCase, PascalCase, spaces, and underscores
 */
function normalizeToKebabCase(name: string): string {
  let normalized = name;
  // Insert hyphens before uppercase letters (handle camelCase/PascalCase)
  normalized = normalized.replace(/([a-z])([A-Z])/g, "$1-$2");
  // Handle consecutive uppercase followed by lowercase (e.g., "HTMLParser" -> "HTML-Parser")
  normalized = normalized.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2");
  // Convert to lowercase
  normalized = normalized.toLowerCase();
  // Replace spaces and underscores with hyphens
  normalized = normalized.replace(/[\s_]+/g, "-");
  // Normalize multiple hyphens to single hyphen
  normalized = normalized.replace(/-+/g, "-");
  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-|-$/g, "");
  return normalized;
}

/**
 * Transform variable alias to token reference
 * @param alias - Figma variable alias
 * @param variableMap - Map of Figma variable IDs to names
 */
export function transformAlias(
  alias: VariableAlias,
  variableMap: Map<string, string>,
): string {
  const variableName = variableMap.get(alias.id);

  if (!variableName) {
    throw new Error(`Alias target not found: ${alias.id}`);
  }

  // Convert Figma variable name to token path with normalized naming
  // "colors/BorderColor/blue" → "{colors.border-color.blue}"
  const tokenPath = variableName
    .split("/")
    .map(normalizeToKebabCase)
    .join(".");

  return `{${tokenPath}}`;
}

/**
 * Transform variable alias to Spectrum format (flattened with hyphens)
 * @param alias - Figma variable alias
 * @param variableMap - Map of Figma variable IDs to names
 */
export function transformAliasToSpectrum(
  alias: VariableAlias,
  variableMap: Map<string, string>,
): string {
  const variableName = variableMap.get(alias.id);

  if (!variableName) {
    throw new Error(`Alias target not found: ${alias.id}`);
  }

  // Convert to flattened format with normalized naming
  // "colors/BorderColor/blue" → "{colors-border-color-blue}"
  const tokenName = variableName
    .split("/")
    .map(normalizeToKebabCase)
    .join("-");

  return `{${tokenName}}`;
}

/**
 * Convert hex color to RGB values (0-1 range)
 */
export function hexToRGB(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  return { r, g, b };
}

/**
 * Main value transformation function
 * Routes to appropriate transformer based on type
 */
export function transformValue(
  value: VariableValue,
  tokenType: string,
  options: {
    defaultUnit?: "px" | "rem";
    variableMap?: Map<string, string>;
    format?: "dtcg" | "spectrum";
  } = {},
): TokenValue {
  const {
    defaultUnit = "px",
    variableMap = new Map(),
    format = "dtcg",
  } = options;

  // Handle aliases
  if (isVariableAlias(value)) {
    return format === "spectrum"
      ? transformAliasToSpectrum(value, variableMap)
      : transformAlias(value, variableMap);
  }

  // Handle colors
  if (isRGB(value) || isRGBA(value)) {
    return format === "spectrum"
      ? transformColorToSpectrum(value)
      : transformColor(value);
  }

  // Handle numbers
  if (typeof value === "number") {
    switch (tokenType) {
      case "dimension":
        return format === "spectrum"
          ? transformDimensionToSpectrum(value, defaultUnit)
          : transformDimension(value, defaultUnit);

      case "opacity":
        return format === "spectrum" ? transformOpacity(value) : value;

      case "fontWeight":
        return format === "spectrum" ? transformFontWeight(value) : value;

      case "multiplier":
        return format === "spectrum" ? value.toString() : value;

      case "number":
        return format === "spectrum" ? value.toString() : value;

      default:
        return value;
    }
  }

  // Handle strings
  if (typeof value === "string") {
    // Check if it's a dimension with unit
    const dimension = transformStringDimension(value);
    if (dimension && tokenType === "dimension") {
      return format === "spectrum"
        ? `${dimension.value}${dimension.unit}`
        : dimension;
    }

    // Check if it's a font weight keyword
    if (tokenType === "fontWeight" && format === "dtcg") {
      return transformFontWeightToNumber(value);
    }

    return value;
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return transformBoolean(value);
  }

  // Default: return as-is
  return value;
}
