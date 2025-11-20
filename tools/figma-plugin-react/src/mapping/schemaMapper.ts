/**
 * Copyright 2024 Adobe. All rights reserved.
 */

/**
 * Schema Mapper
 * Maps token types to Adobe Spectrum schema URLs
 */

import { SPECTRUM_SCHEMAS } from "../shared/types";

export function getSpectrumSchema(
  tokenType: string,
  spectrumSchema?: string,
): string {
  // Use specific schema if provided by type detector
  if (spectrumSchema) {
    const schemaKey = spectrumSchema as keyof typeof SPECTRUM_SCHEMAS;
    if (SPECTRUM_SCHEMAS[schemaKey]) {
      return SPECTRUM_SCHEMAS[schemaKey];
    }
  }

  // Fallback mapping based on token type
  switch (tokenType) {
    case "color":
      return SPECTRUM_SCHEMAS.color;
    case "dimension":
      return SPECTRUM_SCHEMAS.dimension;
    case "fontFamily":
      return SPECTRUM_SCHEMAS.fontFamily;
    case "fontWeight":
      return SPECTRUM_SCHEMAS.fontWeight;
    case "number":
      return SPECTRUM_SCHEMAS.multiplier;
    case "string":
      return SPECTRUM_SCHEMAS.alias;
    default:
      return SPECTRUM_SCHEMAS.color; // Safe fallback
  }
}
