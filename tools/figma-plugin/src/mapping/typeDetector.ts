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
 * Type Detection Algorithm
 * Intelligently detects the appropriate Design Token type based on:
 * - Figma variable type (COLOR, FLOAT, STRING, BOOLEAN)
 * - Variable name patterns and keywords
 * - Value range and characteristics
 * - Variable description and metadata
 */

import type { FigmaVariable, TokenType, VariableValue } from "../shared/types";
import { isVariableAlias } from "../shared/types";

export interface TypeDetectionResult {
  type: TokenType;
  confidence: "high" | "medium" | "low";
  reason: string;
  spectrumSchema?: string;
}

/**
 * Keyword patterns for type detection
 */
const TYPE_PATTERNS = {
  // Border radius patterns (checked before general dimension)
  borderRadius: [
    "radius",
    "corner-radius",
    "border-radius",
    "rounded",
    "corner",
  ],

  // Dimension patterns
  dimension: [
    "size",
    "width",
    "height",
    "spacing",
    "padding",
    "margin",
    "gap",
    "border",
    "stroke",
    "offset",
    "indent",
    "distance",
  ],

  // Opacity patterns
  opacity: ["opacity", "alpha", "transparency", "transparent"],

  // Multiplier/scale patterns
  multiplier: ["scale", "ratio", "multiplier", "factor", "coefficient"],

  // Font family patterns
  fontFamily: ["font-family", "typeface", "font"],

  // Font size patterns
  fontSize: ["font-size", "text-size"],

  // Font weight patterns
  fontWeight: ["font-weight", "weight"],

  // Duration patterns
  duration: ["duration", "time", "delay", "transition", "animation"],

  // Line height patterns
  lineHeight: ["line-height", "leading"],
} as const;

/**
 * Detect token type from Figma variable
 */
export function detectTokenType(
  variable: FigmaVariable,
  value: VariableValue,
): TypeDetectionResult {
  // Handle aliases first
  if (isVariableAlias(value)) {
    return {
      type: "string", // Aliases will be handled specially
      confidence: "high",
      reason: "Variable is an alias reference",
      spectrumSchema: "alias",
    };
  }

  // Detect based on Figma type
  switch (variable.resolvedType) {
    case "COLOR":
      return detectColorType(variable);

    case "FLOAT":
      return detectFloatType(variable, value as number);

    case "STRING":
      return detectStringType(variable, value as string);

    case "BOOLEAN":
      return detectBooleanType(variable);

    default:
      return {
        type: "string",
        confidence: "low",
        reason: `Unknown Figma type: ${variable.resolvedType}`,
      };
  }
}

/**
 * Detect type for COLOR variables
 */
function detectColorType(variable: FigmaVariable): TypeDetectionResult {
  return {
    type: "color",
    confidence: "high",
    reason: "Figma COLOR variable",
    spectrumSchema: "color",
  };
}

/**
 * Detect type for FLOAT variables
 * This is the most complex detection as FLOAT can map to many types
 */
function detectFloatType(
  variable: FigmaVariable,
  value: number,
): TypeDetectionResult {
  const nameLower = variable.name.toLowerCase();
  const description = variable.description.toLowerCase();

  // Check for border radius first (highest priority for radius detection)
  // 1. Check Figma scope for CORNER_RADIUS
  if (variable.scopes.includes("CORNER_RADIUS")) {
    return {
      type: "dimension",
      confidence: "high",
      reason: "Figma CORNER_RADIUS scope detected",
      spectrumSchema: "borderRadius",
    };
  }

  // 2. Check for radius keywords in name or description
  if (hasKeywords([nameLower, description], TYPE_PATTERNS.borderRadius)) {
    return {
      type: "dimension",
      confidence: "high",
      reason: "Border radius keywords detected",
      spectrumSchema: "borderRadius",
    };
  }

  // Check for opacity (highest priority for values 0-1)
  if (value >= 0 && value <= 1) {
    if (hasKeywords([nameLower, description], TYPE_PATTERNS.opacity)) {
      return {
        type: "number",
        confidence: "high",
        reason: "Value in [0,1] range with opacity keywords",
        spectrumSchema: "opacity",
      };
    }

    // If no opacity keywords but value is 0-1, could be opacity or multiplier
    if (hasKeywords([nameLower, description], TYPE_PATTERNS.multiplier)) {
      return {
        type: "number",
        confidence: "high",
        reason: "Value in [0,1] range with multiplier keywords",
        spectrumSchema: "multiplier",
      };
    }

    // Default to opacity for 0-1 values without specific keywords
    return {
      type: "number",
      confidence: "medium",
      reason: "Value in [0,1] range, likely opacity",
      spectrumSchema: "opacity",
    };
  }

  // Check for font weight (100-1000 range)
  if (value >= 100 && value <= 1000) {
    if (hasKeywords([nameLower, description], TYPE_PATTERNS.fontWeight)) {
      return {
        type: "fontWeight",
        confidence: "high",
        reason: "Value in [100,1000] range with weight keywords",
        spectrumSchema: "font-weight",
      };
    }
  }

  // Check for duration (typically milliseconds)
  if (hasKeywords([nameLower, description], TYPE_PATTERNS.duration)) {
    return {
      type: "duration",
      confidence: "high",
      reason: "Duration keywords detected",
    };
  }

  // Check for multiplier/scale
  if (hasKeywords([nameLower, description], TYPE_PATTERNS.multiplier)) {
    return {
      type: "number",
      confidence: "high",
      reason: "Multiplier keywords detected",
      spectrumSchema: "multiplier",
    };
  }

  // Check for line height (typically 1.0-3.0)
  if (value >= 1 && value <= 3) {
    if (hasKeywords([nameLower, description], TYPE_PATTERNS.lineHeight)) {
      return {
        type: "number",
        confidence: "high",
        reason: "Line height keywords detected",
      };
    }
  }

  // Check for font size patterns
  if (hasKeywords([nameLower, description], TYPE_PATTERNS.fontSize)) {
    return {
      type: "dimension",
      confidence: "high",
      reason: "Font size keywords detected",
      spectrumSchema: "font-size",
    };
  }

  // Check for dimension patterns
  if (hasKeywords([nameLower, description], TYPE_PATTERNS.dimension)) {
    return {
      type: "dimension",
      confidence: "high",
      reason: "Dimension keywords detected",
      spectrumSchema: "dimension",
    };
  }

  // Check if value looks like a common pixel value (4, 8, 12, 16, 24, 32, etc.)
  if (isCommonPixelValue(value)) {
    return {
      type: "dimension",
      confidence: "medium",
      reason: "Value matches common pixel dimensions",
      spectrumSchema: "dimension",
    };
  }

  // Default fallback for FLOAT: dimension
  return {
    type: "dimension",
    confidence: "low",
    reason: "No specific pattern detected, defaulting to dimension",
    spectrumSchema: "dimension",
  };
}

/**
 * Detect type for STRING variables
 */
function detectStringType(
  variable: FigmaVariable,
  value: string,
): TypeDetectionResult {
  const nameLower = variable.name.toLowerCase();

  // Check for font family
  if (
    hasKeywords([nameLower], TYPE_PATTERNS.fontFamily) ||
    isFontFamilyValue(value)
  ) {
    return {
      type: "fontFamily",
      confidence: "high",
      reason: "Font family keywords or font name detected",
      spectrumSchema: "font-family",
    };
  }

  // Check for font weight string values
  if (
    hasKeywords([nameLower], TYPE_PATTERNS.fontWeight) ||
    isFontWeightValue(value)
  ) {
    return {
      type: "fontWeight",
      confidence: "high",
      reason: "Font weight keywords or weight name detected",
      spectrumSchema: "font-weight",
    };
  }

  // Check for dimension with unit (e.g., "16px", "1.5rem")
  if (hasDimensionUnit(value)) {
    return {
      type: "dimension",
      confidence: "high",
      reason: "Value contains dimension unit",
      spectrumSchema: "dimension",
    };
  }

  // Default to generic string
  return {
    type: "string",
    confidence: "medium",
    reason: "Generic string value",
  };
}

/**
 * Detect type for BOOLEAN variables
 */
function detectBooleanType(variable: FigmaVariable): TypeDetectionResult {
  return {
    type: "number", // Booleans converted to 0/1
    confidence: "high",
    reason: "Boolean variable (will be converted to 0/1)",
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if any of the texts contain any of the keywords
 */
function hasKeywords(texts: string[], keywords: readonly string[]): boolean {
  return texts.some((text) =>
    keywords.some((keyword) => text.includes(keyword)),
  );
}

/**
 * Check if value is a common pixel value used in design systems
 */
function isCommonPixelValue(value: number): boolean {
  // Common spacing/sizing scales: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
  const commonValues = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
  return commonValues.includes(value);
}

/**
 * Check if string looks like a font family name
 */
function isFontFamilyValue(value: string): boolean {
  // Common font indicators
  const fontIndicators = [
    "sans",
    "serif",
    "mono",
    "arial",
    "helvetica",
    "roboto",
    "open sans",
    "lato",
    "montserrat",
    "source",
    "noto",
    "inter",
    "poppins",
    "system-ui",
  ];

  const valueLower = value.toLowerCase();
  return fontIndicators.some((indicator) => valueLower.includes(indicator));
}

/**
 * Check if string is a font weight keyword
 */
function isFontWeightValue(value: string): boolean {
  const weightKeywords = [
    "thin",
    "light",
    "regular",
    "normal",
    "medium",
    "semibold",
    "bold",
    "extrabold",
    "black",
  ];

  const valueLower = value.toLowerCase();
  return weightKeywords.includes(valueLower);
}

/**
 * Check if string contains a dimension unit
 */
function hasDimensionUnit(value: string): boolean {
  const unitPattern = /^\d+(\.\d+)?(px|rem|em|%|pt|dp)$/;
  return unitPattern.test(value.trim());
}

/**
 * Detect unit from dimension string (e.g., "16px" → "px")
 */
export function extractUnit(value: string): string | null {
  const match = value.trim().match(/^\d+(\.\d+)?(px|rem|em|%|pt|dp)$/);
  return match ? match[2] || null : null;
}

/**
 * Extract numeric value from dimension string (e.g., "16px" → 16)
 */
export function extractNumericValue(value: string): number | null {
  const match = value.trim().match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]!) : null;
}

/**
 * Get confidence score as a number (for sorting/filtering)
 */
export function getConfidenceScore(
  confidence: "high" | "medium" | "low",
): number {
  switch (confidence) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}
