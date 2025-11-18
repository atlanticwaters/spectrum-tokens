# Design System Expert Tasks

## Overview

You are responsible for the token mapping logic - converting Figma variables to Design Tokens specification format with Adobe Spectrum extensions. This is the core intelligence of the plugin.

## Your Responsibilities

1. Token type detection from Figma variables
2. Value conversion and formatting
3. Schema URL assignment
4. UUID generation
5. Alias reference resolution
6. Token validation
7. Creating example token exports

## Phase 1: Type Detection System

### Task 1.1: Implement Type Detector

**File:** `/tools/figma-plugin/src/mapping/typeDetector.ts`

**Requirements:**
Detect Design Token type from Figma variable using:

1. Figma variable type (COLOR, FLOAT, STRING, BOOLEAN)
2. Semantic analysis of variable name
3. Value pattern matching

**Type Mapping Rules:**

| Figma Type | Keywords                                                           | Token Type | Schema           |
| ---------- | ------------------------------------------------------------------ | ---------- | ---------------- |
| COLOR      | any                                                                | color      | color.json       |
| FLOAT      | size, width, height, spacing, padding, margin, gap, radius, border | dimension  | dimension.json   |
| FLOAT      | opacity, alpha, transparency                                       | opacity    | opacity.json     |
| FLOAT      | scale, ratio, multiplier, factor                                   | multiplier | multiplier.json  |
| FLOAT      | (default)                                                          | dimension  | dimension.json   |
| STRING     | font-family, typeface, font                                        | fontFamily | font-family.json |
| STRING     | font-size                                                          | fontSize   | font-size.json   |
| STRING     | font-weight                                                        | fontWeight | font-weight.json |
| STRING     | font-style                                                         | fontStyle  | font-style.json  |
| STRING     | (alias reference)                                                  | alias      | alias.json       |
| STRING     | (default)                                                          | string     | token.json       |
| BOOLEAN    | any                                                                | boolean    | token.json       |

**Implementation:**

```typescript
export type TokenType =
  | 'color'
  | 'dimension'
  | 'opacity'
  | 'multiplier'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'fontStyle'
  | 'alias'
  | 'string'
  | 'boolean';

export interface FigmaVariable {
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: { [modeId: string]: any };
}

/**
 * Detects the Design Token type for a Figma variable
 */
export function detectType(variable: FigmaVariable): TokenType {
  const { name, resolvedType } = variable;
  const nameLower = name.toLowerCase();

  // COLOR always maps to color
  if (resolvedType === 'COLOR') {
    return 'color';
  }

  // BOOLEAN always maps to boolean
  if (resolvedType === 'BOOLEAN') {
    return 'boolean';
  }

  // Check if it's an alias reference
  const value = Object.values(variable.valuesByMode)[0];
  if (isAlias(value)) {
    return 'alias';
  }

  // FLOAT - detect based on name keywords
  if (resolvedType === 'FLOAT') {
    if (hasDimensionKeyword(nameLower)) return 'dimension';
    if (hasOpacityKeyword(nameLower)) return 'opacity';
    if (hasMultiplierKeyword(nameLower)) return 'multiplier';
    return 'dimension'; // Default for FLOAT
  }

  // STRING - detect based on name keywords
  if (resolvedType === 'STRING') {
    if (hasFontFamilyKeyword(nameLower)) return 'fontFamily';
    if (hasFontSizeKeyword(nameLower)) return 'fontSize';
    if (hasFontWeightKeyword(nameLower)) return 'fontWeight';
    if (hasFontStyleKeyword(nameLower)) return 'fontStyle';
    return 'string'; // Default for STRING
  }

  return 'string'; // Fallback
}

// Helper functions
function hasDimensionKeyword(name: string): boolean {
  const keywords = [
    'size', 'width', 'height', 'spacing', 'padding', 'margin',
    'gap', 'radius', 'border', 'stroke', 'offset', 'inset'
  ];
  return keywords.some(kw => name.includes(kw));
}

function hasOpacityKeyword(name: string): boolean {
  const keywords = ['opacity', 'alpha', 'transparency'];
  return keywords.some(kw => name.includes(kw));
}

function hasMultiplierKeyword(name: string): boolean {
  const keywords = ['scale', 'ratio', 'multiplier', 'factor'];
  return keywords.some(kw => name.includes(kw));
}

function hasFontFamilyKeyword(name: string): boolean {
  const keywords = ['font-family', 'typeface', 'font'];
  return keywords.some(kw => name.includes(kw)) && !name.includes('size');
}

function hasFontSizeKeyword(name: string): boolean {
  return name.includes('font-size') || name.includes('text-size');
}

function hasFontWeightKeyword(name: string): boolean {
  return name.includes('font-weight') || name.includes('weight');
}

function hasFontStyleKeyword(name: string): boolean {
  return name.includes('font-style');
}

function isAlias(value: any): boolean {
  // Figma represents aliases as objects with 'id' property referencing another variable
  return typeof value === 'object' && value !== null && 'id' in value;
}
```

**Testing:**
Create test file `/tools/figma-plugin/test/typeDetector.test.ts`:

```typescript
import test from 'ava';
import { detectType } from '../src/mapping/typeDetector.js';

test('detects color type from COLOR variable', t => {
  const variable = {
    name: 'primary-color',
    resolvedType: 'COLOR',
    valuesByMode: { 'mode1': { r: 1, g: 0, b: 0 } }
  };
  t.is(detectType(variable), 'color');
});

test('detects dimension from FLOAT with size keyword', t => {
  const variable = {
    name: 'button-size',
    resolvedType: 'FLOAT',
    valuesByMode: { 'mode1': 32 }
  };
  t.is(detectType(variable), 'dimension');
});

test('detects opacity from FLOAT with opacity keyword', t => {
  const variable = {
    name: 'disabled-opacity',
    resolvedType: 'FLOAT',
    valuesByMode: { 'mode1': 0.4 }
  };
  t.is(detectType(variable), 'opacity');
});

test('detects multiplier from FLOAT with scale keyword', t => {
  const variable = {
    name: 'hover-scale',
    resolvedType: 'FLOAT',
    valuesByMode: { 'mode1': 1.05 }
  };
  t.is(detectType(variable), 'multiplier');
});

test('detects fontFamily from STRING with font keyword', t => {
  const variable = {
    name: 'font-family-base',
    resolvedType: 'STRING',
    valuesByMode: { 'mode1': 'Adobe Clean' }
  };
  t.is(detectType(variable), 'fontFamily');
});

test('detects alias from variable reference', t => {
  const variable = {
    name: 'button-background',
    resolvedType: 'COLOR',
    valuesByMode: { 'mode1': { id: 'var123' } }
  };
  t.is(detectType(variable), 'alias');
});
```

### Task 1.2: Implement Schema Mapper

**File:** `/tools/figma-plugin/src/mapping/schemaMapper.ts`

**Requirements:**
Map token types to Adobe Spectrum schema URLs.

**Schema URL Format:**

```
https://opensource.adobe.com/spectrum-tokens/schemas/token-types/[type].json
```

**Available Schemas:**

* alias.json
* color.json
* color-set.json
* dimension.json
* drop-shadow\.json
* font-family.json
* font-size.json
* font-style.json
* font-weight.json
* gradient-stop.json
* multiplier.json
* opacity.json
* scale-set.json
* set.json
* system-set.json
* text-align.json
* text-transform.json
* token.json (generic)
* typography.json

**Implementation:**

```typescript
import { TokenType } from './typeDetector.js';

const SCHEMA_BASE_URL = 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types';

const SCHEMA_MAP: Record<TokenType, string> = {
  color: 'color.json',
  dimension: 'dimension.json',
  opacity: 'opacity.json',
  multiplier: 'multiplier.json',
  fontFamily: 'font-family.json',
  fontSize: 'font-size.json',
  fontWeight: 'font-weight.json',
  fontStyle: 'font-style.json',
  alias: 'alias.json',
  string: 'token.json',
  boolean: 'token.json',
};

/**
 * Gets the schema URL for a given token type
 */
export function getSchemaUrl(type: TokenType): string {
  const schemaFile = SCHEMA_MAP[type] || 'token.json';
  return `${SCHEMA_BASE_URL}/${schemaFile}`;
}

/**
 * Validates that a schema file exists (optional - for future use)
 */
export function isValidSchema(type: TokenType): boolean {
  return type in SCHEMA_MAP;
}
```

**Testing:**

```typescript
import test from 'ava';
import { getSchemaUrl } from '../src/mapping/schemaMapper.js';

test('returns correct schema URL for color', t => {
  const url = getSchemaUrl('color');
  t.is(url, 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json');
});

test('returns correct schema URL for dimension', t => {
  const url = getSchemaUrl('dimension');
  t.is(url, 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/dimension.json');
});

test('returns generic schema for unknown type', t => {
  const url = getSchemaUrl('string');
  t.is(url, 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/token.json');
});
```

## Phase 2: Value Conversion

### Task 2.1: Implement Value Formatters

**File:** `/tools/figma-plugin/src/utils/formatters.ts`

**Requirements:**
Convert Figma values to Design Token format.

**Implementation:**

```typescript
/**
 * Formats a color value to hex string
 * Figma colors are {r, g, b, a} with values 0-1
 */
export function formatColorValue(color: RGBA): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? Math.round(color.a * 255) : 255;

  if (a === 255) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  } else {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`.toUpperCase();
  }
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

/**
 * Formats a numeric value
 * Remove trailing zeros, avoid scientific notation
 */
export function formatNumericValue(value: number): string {
  return value.toString().replace(/\.0+$/, '');
}

/**
 * Formats an alias reference
 * Figma: {id: 'var123'}
 * Design Tokens: '{variable-name}'
 */
export function formatAliasValue(
  aliasId: string,
  variableMap: Map<string, string>
): string {
  const variableName = variableMap.get(aliasId);
  if (!variableName) {
    throw new Error(`Alias reference not found: ${aliasId}`);
  }
  return `{${sanitizeTokenName(variableName)}}`;
}

/**
 * Sanitizes a token name
 * Converts spaces to hyphens, lowercase, remove special chars
 */
export function sanitizeTokenName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a?: number;
}
```

**Testing:**

```typescript
import test from 'ava';
import { formatColorValue, formatNumericValue, sanitizeTokenName } from '../src/utils/formatters.js';

test('formats RGB color to hex', t => {
  const color = { r: 1, g: 0, b: 0 };
  t.is(formatColorValue(color), '#FF0000');
});

test('formats RGBA color to hex with alpha', t => {
  const color = { r: 1, g: 0, b: 0, a: 0.5 };
  t.is(formatColorValue(color), '#FF000080');
});

test('formats numeric value without trailing zeros', t => {
  t.is(formatNumericValue(32.0), '32');
  t.is(formatNumericValue(0.5), '0.5');
  t.is(formatNumericValue(1.25), '1.25');
});

test('sanitizes token names', t => {
  t.is(sanitizeTokenName('Button Size'), 'button-size');
  t.is(sanitizeTokenName('Primary Color!'), 'primary-color');
  t.is(sanitizeTokenName('font_family'), 'font_family');
});
```

## Phase 3: Main Conversion Logic

### Task 3.1: Implement Figma to Spec Converter

**File:** `/tools/figma-plugin/src/mapping/figmaToSpec.ts`

**Requirements:**
Main function that orchestrates the conversion.

**Implementation:**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { detectType } from './typeDetector.js';
import { getSchemaUrl } from './schemaMapper.js';
import {
  formatColorValue,
  formatNumericValue,
  formatAliasValue,
  sanitizeTokenName
} from '../utils/formatters.js';

export interface DesignToken {
  $value: string | number;
  $type?: string;
  $description?: string;
  $schema: string;
  uuid: string;
  component?: string;
  deprecated?: boolean;
  private?: boolean;
}

export interface ConversionContext {
  collectionName: string;
  variableMap: Map<string, string>; // Map of variable ID to name
  modeId?: string; // Which mode to use (default to first)
}

/**
 * Converts a Figma variable to a Design Token
 */
export function convertVariable(
  variable: Variable,
  context: ConversionContext
): DesignToken {
  const type = detectType(variable);
  const schemaUrl = getSchemaUrl(type);

  // Get value from the appropriate mode
  const modeId = context.modeId || Object.keys(variable.valuesByMode)[0];
  const rawValue = variable.valuesByMode[modeId];

  // Convert value based on type
  let value: string | number;

  switch (type) {
    case 'color':
      value = formatColorValue(rawValue);
      break;

    case 'alias':
      value = formatAliasValue(rawValue.id, context.variableMap);
      break;

    case 'dimension':
    case 'opacity':
    case 'multiplier':
      value = formatNumericValue(rawValue);
      break;

    case 'fontFamily':
    case 'fontSize':
    case 'fontWeight':
    case 'fontStyle':
    case 'string':
      value = rawValue.toString();
      break;

    case 'boolean':
      value = rawValue ? 'true' : 'false';
      break;

    default:
      value = rawValue.toString();
  }

  // Build token object
  const token: DesignToken = {
    $value: value,
    $schema: schemaUrl,
    uuid: uuidv4(),
  };

  // Optional properties
  if (type !== 'alias') {
    token.$type = type;
  }

  if (variable.description) {
    token.$description = variable.description;
  }

  if (context.collectionName) {
    token.component = sanitizeTokenName(context.collectionName);
  }

  // Figma doesn't have deprecated/private flags, but could be inferred from name
  if (variable.name.includes('deprecated') || variable.name.includes('_deprecated')) {
    token.deprecated = true;
  }

  if (variable.name.startsWith('_') || variable.name.includes('private')) {
    token.private = true;
  }

  return token;
}

/**
 * Converts all variables in a collection to tokens
 */
export function convertCollection(
  variables: Variable[],
  collectionName: string,
  modeId?: string
): Record<string, DesignToken> {
  // Build variable map for alias resolution
  const variableMap = new Map<string, string>();
  variables.forEach(v => variableMap.set(v.id, v.name));

  const context: ConversionContext = {
    collectionName,
    variableMap,
    modeId
  };

  const tokens: Record<string, DesignToken> = {};

  for (const variable of variables) {
    const tokenName = sanitizeTokenName(variable.name);
    tokens[tokenName] = convertVariable(variable, context);
  }

  return tokens;
}
```

**Testing:**

```typescript
import test from 'ava';
import { convertVariable, convertCollection } from '../src/mapping/figmaToSpec.js';

test('converts color variable', t => {
  const variable = {
    id: 'var1',
    name: 'Primary Color',
    resolvedType: 'COLOR',
    valuesByMode: { 'mode1': { r: 1, g: 0, b: 0 } },
    description: 'Main brand color'
  };

  const context = {
    collectionName: 'colors',
    variableMap: new Map([['var1', 'Primary Color']])
  };

  const token = convertVariable(variable, context);

  t.is(token.$value, '#FF0000');
  t.is(token.$type, 'color');
  t.is(token.$description, 'Main brand color');
  t.truthy(token.uuid);
  t.is(token.component, 'colors');
});

test('converts dimension variable', t => {
  const variable = {
    id: 'var2',
    name: 'button-size',
    resolvedType: 'FLOAT',
    valuesByMode: { 'mode1': 32 }
  };

  const context = {
    collectionName: 'dimensions',
    variableMap: new Map([['var2', 'button-size']])
  };

  const token = convertVariable(variable, context);

  t.is(token.$value, '32');
  t.is(token.$type, 'dimension');
});

test('converts alias variable', t => {
  const variable = {
    id: 'var3',
    name: 'button-background',
    resolvedType: 'COLOR',
    valuesByMode: { 'mode1': { id: 'var1' } }
  };

  const context = {
    collectionName: 'components',
    variableMap: new Map([
      ['var1', 'Primary Color'],
      ['var3', 'button-background']
    ])
  };

  const token = convertVariable(variable, context);

  t.is(token.$value, '{primary-color}');
  t.is(token.$type, undefined); // Aliases don't have $type
});
```

## Phase 4: UUID Generation

### Task 4.1: Implement UUID Generator

**File:** `/tools/figma-plugin/src/utils/uuid.ts`

**Requirements:**
Generate v4 UUIDs for tokens.

**Implementation:**

```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a v4 UUID
 */
export function generateUuid(): string {
  return uuidv4();
}

/**
 * Validates a UUID format
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

**Note:** Uses the `uuid` package which should be installed as a dependency.

## Phase 5: Validation

### Task 5.1: Implement Token Validators

**File:** `/tools/figma-plugin/src/utils/validators.ts`

**Requirements:**
Validate token structure and values.

**Implementation:**

```typescript
import { DesignToken } from '../mapping/figmaToSpec.js';
import { isValidUuid } from './uuid.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a token object
 */
export function validateToken(
  tokenName: string,
  token: DesignToken
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: $value
  if (token.$value === undefined || token.$value === null) {
    errors.push(`Token '${tokenName}' missing required $value property`);
  }

  // Required: uuid
  if (!token.uuid) {
    errors.push(`Token '${tokenName}' missing required uuid property`);
  } else if (!isValidUuid(token.uuid)) {
    errors.push(`Token '${tokenName}' has invalid UUID format`);
  }

  // Recommended: $schema
  if (!token.$schema) {
    warnings.push(`Token '${tokenName}' missing $schema property`);
  }

  // Type-specific validation
  if (token.$type === 'color') {
    if (!isValidColorValue(token.$value as string)) {
      errors.push(`Token '${tokenName}' has invalid color value: ${token.$value}`);
    }
  }

  if (token.$type === 'opacity') {
    const value = parseFloat(token.$value as string);
    if (isNaN(value) || value < 0 || value > 1) {
      errors.push(`Token '${tokenName}' has invalid opacity value (must be 0-1): ${token.$value}`);
    }
  }

  if (token.$type === 'alias') {
    if (!isValidAliasValue(token.$value as string)) {
      errors.push(`Token '${tokenName}' has invalid alias reference: ${token.$value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function isValidColorValue(value: string): boolean {
  const hexRegex = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
  return hexRegex.test(value);
}

function isValidAliasValue(value: string): boolean {
  const aliasRegex = /^{[a-zA-Z0-9-_/]+}$/;
  return aliasRegex.test(value);
}

/**
 * Validates an entire token collection
 */
export function validateTokenCollection(
  tokens: Record<string, DesignToken>
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const [name, token] of Object.entries(tokens)) {
    const result = validateToken(name, token);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}
```

**Testing:**

```typescript
import test from 'ava';
import { validateToken } from '../src/utils/validators.js';

test('validates valid token', t => {
  const token = {
    $value: '#FF0000',
    $type: 'color',
    $schema: 'https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json',
    uuid: '123e4567-e89b-12d3-a456-426614174000'
  };

  const result = validateToken('test-token', token);
  t.true(result.valid);
  t.is(result.errors.length, 0);
});

test('detects missing $value', t => {
  const token = {
    uuid: '123e4567-e89b-12d3-a456-426614174000'
  };

  const result = validateToken('test-token', token);
  t.false(result.valid);
  t.true(result.errors.some(e => e.includes('missing required $value')));
});

test('detects invalid color value', t => {
  const token = {
    $value: 'red',
    $type: 'color',
    uuid: '123e4567-e89b-12d3-a456-426614174000'
  };

  const result = validateToken('test-token', token);
  t.false(result.valid);
  t.true(result.errors.some(e => e.includes('invalid color value')));
});
```

## Phase 6: Example Exports

### Task 6.1: Create Example Token Files

**Directory:** `/tools/figma-plugin/examples/`

Create comprehensive example files demonstrating all token types:

**File:** `examples/colors.json`

```json
{
  "gray-50": {
    "$type": "color",
    "$value": "#F5F5F5",
    "$schema": "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/color.json",
    "uuid": "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5g6h7"
  },
  ...
}
```

**File:** `examples/dimensions.json`
**File:** `examples/typography.json`
**File:** `examples/aliases.json`

## Deliverables Checklist

* [ ] Type detector with keyword-based detection
* [ ] Schema mapper with all Spectrum schemas
* [ ] Value formatters (color, numeric, alias)
* [ ] Main conversion function (figmaToSpec)
* [ ] UUID generator
* [ ] Token validators
* [ ] Unit tests with >80% coverage
* [ ] Example token exports for all types
* [ ] Documentation of mapping rules

## Testing Requirements

All mapping logic must have comprehensive tests:

* Type detection for all Figma types
* Type detection for all keyword patterns
* Value formatting for all types
* Alias resolution
* UUID generation and validation
* Token validation for valid/invalid cases

## Success Criteria

* All Figma variable types correctly mapped
* Generated tokens validate against Spectrum schemas
* Alias references properly formatted
* UUIDs are valid v4 format
* No data loss during conversion
* Clear documentation of mapping rules
