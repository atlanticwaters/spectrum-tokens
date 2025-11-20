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
 * Style Dictionary Transformer
 * Transforms DTCG tokens to Style Dictionary format for internal tooling
 * Based on custom transformer by JC for Style Dictionary integration
 */

import type { DesignToken } from "../shared/types";

/**
 * Helper function to extract numeric value from various input types
 */
const getNumber = (val: unknown): number => {
  if (typeof val === 'object' && val !== null && 'value' in val) {
    return getNumber((val as { value: unknown }).value);
  }
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.\-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

/**
 * Helper function to extract string value from various input types
 */
const getString = (val: unknown): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return `${val}`;
  if (typeof val === 'object' && val !== null && 'value' in val) {
    return getString((val as { value: unknown }).value);
  }
  return '';
};

/**
 * Clamps a value between 0 and 1
 */
const clamp01 = (value: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

/**
 * Normalizes a color component (0-255 or 0-1) to 0-1 range
 */
const normalizeComponent = (value: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value > 1 ? clamp01(value / 255) : clamp01(value);
};

/**
 * Converts a normalized component (0-1) to hex byte (00-FF)
 */
const byteHex = (value: number): string =>
  Math.round(clamp01(value) * 255).toString(16).padStart(2, '0').toUpperCase();

/**
 * Formats a component value for Swift (0-1 range with minimal decimal places)
 */
const formatSwiftComponent = (value: number): string => {
  const clamped = clamp01(value);
  const fixed = clamped.toFixed(3);
  return fixed.replace(/\.?0+$/, '') || '0';
};

/**
 * Normalizes hex color to 6 or 8 digit uppercase format
 */
const normalizeHex = (hex: string): string => {
  if (!hex) return '000000';
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length === 6 || cleanHex.length === 8) {
    return cleanHex.toUpperCase();
  }
  return '000000';
};

/**
 * Converts hex color to RGBA components (0-1 range)
 */
const hexToComponents = (hex: string): { red: number; green: number; blue: number; alpha: number } => {
  const cleanHex = normalizeHex(hex);
  const hasAlpha = cleanHex.length === 8;
  const offset = hasAlpha ? 2 : 0;
  const hexPairs = cleanHex.match(/.{1,2}/g) || [];
  const r = parseInt(hexPairs[offset], 16) / 255 || 0;
  const g = parseInt(hexPairs[offset + 1], 16) / 255 || 0;
  const b = parseInt(hexPairs[offset + 2], 16) / 255 || 0;
  const a = hasAlpha ? parseInt(hexPairs[0], 16) / 255 : 1;
  return { red: r, green: g, blue: b, alpha: a };
};

/**
 * Parses color value from token and returns normalized RGBA components
 */
interface ColorComponents {
  red: number;
  green: number;
  blue: number;
  alpha: number;
  hex: string;
}

const parseColorValue = (tokenValue: unknown): ColorComponents => {
  if (typeof tokenValue === 'string') {
    return { ...hexToComponents(tokenValue), hex: normalizeHex(tokenValue) };
  }

  if (tokenValue && typeof tokenValue === 'object') {
    const raw = tokenValue as Record<string, unknown>;
    const components = Array.isArray(raw.components) ? raw.components : [];
    let { red, green, blue, alpha } = { red: 0, green: 0, blue: 0, alpha: 1 };

    if (components.length >= 3) {
      [red, green, blue] = components as number[];
      alpha = typeof raw.alpha === 'number' ? raw.alpha : (components[3] as number | undefined) ?? 1;
    } else if (raw.hex && typeof raw.hex === 'string') {
      const fromHex = hexToComponents(raw.hex);
      red = fromHex.red;
      green = fromHex.green;
      blue = fromHex.blue;
      alpha = typeof raw.alpha === 'number' ? raw.alpha : fromHex.alpha;
    } else {
      alpha = typeof raw.alpha === 'number' ? raw.alpha : 1;
    }

    const normalizedRed = normalizeComponent(red);
    const normalizedGreen = normalizeComponent(green);
    const normalizedBlue = normalizeComponent(blue);
    const normalizedAlpha = clamp01(alpha ?? 1);
    const hexSource = typeof raw.hex === 'string'
      ? raw.hex
      : `${byteHex(normalizedRed)}${byteHex(normalizedGreen)}${byteHex(normalizedBlue)}`;

    return {
      red: normalizedRed,
      green: normalizedGreen,
      blue: normalizedBlue,
      alpha: normalizedAlpha,
      hex: normalizeHex(hexSource)
    };
  }

  return { red: 0, green: 0, blue: 0, alpha: 1, hex: '000000' };
};

/**
 * Style Dictionary token interface (compatible with custom transforms)
 */
export interface StyleDictionaryToken {
  value: string | number | Record<string, unknown>;
  type?: string;
  $type?: string;
  path?: string[];
  name?: string;
  comment?: string;
  attributes?: Record<string, unknown>;
  original?: {
    value: unknown;
  };
}

/**
 * Transform token for Android naming convention
 */
export const transformNameAndroid = (tokenName: string, path: string[]): string => {
  return path.join('_').replace(/-/g, '_').toLowerCase();
};

/**
 * Transform token name to PascalCase
 */
export const transformNamePascal = (tokenName: string, path: string[], prefix?: string): string => {
  const parts = prefix ? [prefix, ...path] : path;
  return parts
    .join(' ')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
};

/**
 * Transform dimension value to CGFloat format (iOS)
 */
export const transformSizeCGFloat = (value: unknown): string => {
  return `CGFloat(${getNumber(value)})`;
};

/**
 * Transform dimension value to Android XML dp format
 */
export const transformAndroidXmlDp = (value: unknown): string => {
  return `${getNumber(value)}dp`;
};

/**
 * Transform font size value to Android XML sp format
 */
export const transformAndroidXmlSp = (value: unknown): string => {
  return `${getNumber(value)}sp`;
};

/**
 * Transform dimension value to Compose dp format
 */
export const transformComposeDp = (value: unknown): string => {
  return `${getNumber(value)}.dp`;
};

/**
 * Transform font size value to Compose sp format
 */
export const transformComposeSp = (value: unknown): string => {
  return `${getNumber(value)}.sp`;
};

/**
 * Transform color to SwiftUI format
 */
export const transformColorSwiftUI = (value: unknown): string => {
  const { red, green, blue, alpha } = parseColorValue(value);
  return `Color(red: ${formatSwiftComponent(red)}, green: ${formatSwiftComponent(green)}, blue: ${formatSwiftComponent(blue)}, opacity: ${formatSwiftComponent(alpha)})`;
};

/**
 * Transform color to Jetpack Compose format
 */
export const transformColorCompose = (value: unknown): string => {
  const { red, green, blue, alpha } = parseColorValue(value);
  const argb = `${byteHex(alpha)}${byteHex(red)}${byteHex(green)}${byteHex(blue)}`;
  return `Color(0x${argb})`;
};

/**
 * Transform typography token to Compose TextStyle format
 */
export const transformTypographyCompose = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';

  const typographyValue = value as Record<string, unknown>;
  const fontFamily = getString(typographyValue.fontFamily).toLowerCase().replace(/ /g, '_');
  const fontSize = typographyValue.fontSize;
  const fontWeight = typographyValue.fontWeight ?? 400;

  return `TextStyle(fontFamily = FontFamily(Font(R.font.${fontFamily})), fontSize = ${getNumber(fontSize)}.sp, fontWeight = FontWeight(${fontWeight}))`;
};

/**
 * Transform typography token to Swift Font.system format
 */
export const transformTypographySwift = (value: unknown): string => {
  if (!value || typeof value !== 'object') return '';

  const typographyValue = value as Record<string, unknown>;
  const { fontSize, fontWeight } = typographyValue;

  const weightMap: Record<number, string> = {
    100: '.ultralight',
    200: '.thin',
    300: '.light',
    400: '.regular',
    500: '.medium',
    600: '.semibold',
    700: '.bold',
    800: '.heavy',
    900: '.black'
  };

  const numericWeight = parseInt(String(fontWeight));
  const swiftWeight = weightMap[numericWeight] || '.regular';

  return `Font.system(size: ${getNumber(fontSize)}, weight: ${swiftWeight})`;
};

/**
 * Transform DTCG tokens to Style Dictionary format
 * This function restructures the token tree to be compatible with Style Dictionary
 */
export function transformToStyleDictionary(
  dtcgTokens: Record<string, DesignToken | Record<string, unknown>>,
  options?: {
    platform?: 'ios' | 'android' | 'web' | 'compose';
    includeTransforms?: boolean;
  }
): Record<string, StyleDictionaryToken | Record<string, unknown>> {
  const platform = options?.platform || 'web';
  const includeTransforms = options?.includeTransforms ?? true;

  const transformToken = (
    token: DesignToken | Record<string, unknown>,
    path: string[] = []
  ): StyleDictionaryToken | Record<string, unknown> => {
    // Check if this is a token (has $value) or a group
    if ('$value' in token) {
      const designToken = token as DesignToken;
      const styleDictionaryToken: StyleDictionaryToken = {
        value: designToken.$value as string | number | Record<string, unknown>,
        type: designToken.$type,
        path,
      };

      if (designToken.$description) {
        styleDictionaryToken.comment = designToken.$description;
      }

      // Add original value for reference
      styleDictionaryToken.original = {
        value: designToken.$value
      };

      // Apply platform-specific transforms if requested
      if (includeTransforms && designToken.$type) {
        const tokenType = designToken.$type;
        const value = designToken.$value;

        switch (platform) {
          case 'ios':
            if (tokenType === 'color') {
              styleDictionaryToken.value = transformColorSwiftUI(value);
            } else if (tokenType === 'dimension' || tokenType === 'number') {
              styleDictionaryToken.value = transformSizeCGFloat(value);
            } else if (tokenType === 'typography') {
              styleDictionaryToken.value = transformTypographySwift(value);
            }
            break;

          case 'android':
            if (tokenType === 'color') {
              styleDictionaryToken.value = transformColorCompose(value);
            } else if (tokenType === 'dimension') {
              styleDictionaryToken.value = transformAndroidXmlDp(value);
            } else if (tokenType === 'fontFamily') {
              styleDictionaryToken.value = transformAndroidXmlSp(value);
            }
            break;

          case 'compose':
            if (tokenType === 'color') {
              styleDictionaryToken.value = transformColorCompose(value);
            } else if (tokenType === 'dimension') {
              styleDictionaryToken.value = transformComposeDp(value);
            } else if (tokenType === 'typography') {
              styleDictionaryToken.value = transformTypographyCompose(value);
            }
            break;

          case 'web':
            // Keep original values for web platform
            break;
        }
      }

      return styleDictionaryToken;
    }

    // It's a group, recursively transform children
    const group: Record<string, StyleDictionaryToken | Record<string, unknown>> = {};

    for (const [key, value] of Object.entries(token)) {
      // Skip metadata properties that start with $
      if (key.startsWith('$')) continue;

      if (value && typeof value === 'object') {
        group[key] = transformToken(
          value as DesignToken | Record<string, unknown>,
          [...path, key]
        );
      }
    }

    return group;
  };

  return transformToken(dtcgTokens) as Record<string, StyleDictionaryToken | Record<string, unknown>>;
}
