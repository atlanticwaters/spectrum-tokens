# Border Radius Detection

## Overview

The Figma Plugin now has enhanced support for detecting and extracting border radius (corner radius) values from Figma variables. This ensures that radius values are properly identified and can be distinguished from other dimension types like padding, margin, and spacing.

## Detection Methods

The plugin uses a **two-tier detection system** to identify radius values:

### 1. Figma Scope Detection (Highest Priority)

Figma provides a built-in `CORNER_RADIUS` scope that can be assigned to variables. When a variable has this scope, the plugin **automatically** identifies it as a border radius value, regardless of its name.

**Example:**

```typescript
// Figma variable with CORNER_RADIUS scope
{
  name: "button/border",
  scopes: ["CORNER_RADIUS"],
  resolvedType: "FLOAT",
  value: 8
}
// ✅ Detected as borderRadius
```

### 2. Keyword Detection (Fallback)

If a variable doesn't have the `CORNER_RADIUS` scope, the plugin checks for radius-related keywords in the variable's **name** or **description**:

**Detected keywords:**

* `radius`
* `corner-radius`
* `border-radius`
* `rounded`
* `corner`

**Examples:**

```typescript
// ✅ Detected by name
{ name: "corner-radius-100", value: 4 }
{ name: "button/border-radius", value: 8 }
{ name: "rounded-corner", value: 12 }

// ✅ Detected by description
{
  name: "button/size",
  description: "Corner radius for small buttons",
  value: 4
}
```

## Schema Assignment

When a radius value is detected, the plugin assigns:

* **Token type:** `dimension` (follows DTCG spec)
* **Spectrum schema:** `borderRadius` (internal identifier)
* **Schema URL:** `dimension.json` (follows Spectrum's schema structure)

This allows radius values to be:

1. **Properly typed** as dimensions in the DTCG format
2. **Distinguished** from other dimensions via the `spectrumSchema` hint
3. **Tracked** via Figma scope information in `$extensions`

## Exported Token Format

### DTCG Format

```json
{
  "corner-radius-small": {
    "$type": "dimension",
    "$value": "4px",
    "$description": "Small corner radius for UI elements",
    "$extensions": {
      "com.figma": {
        "scopes": ["CORNER_RADIUS"],
        "detectionReason": "Figma CORNER_RADIUS scope detected"
      }
    }
  }
}
```

### Spectrum Format

```json
{
  "corner-radius-small": {
    "$schema": "https://opensource.adobe.com/spectrum-tokens/schemas/token-types/dimension.json",
    "value": "4px",
    "uuid": "9aebcdef-e89b-12d3-a456-426614174008"
  }
}
```

## Detection Priority

The plugin checks for radius in this order:

1. **CORNER\_RADIUS scope** → Highest confidence
2. **Radius keywords** in name/description → High confidence
3. **Other dimension patterns** → Fallback to generic dimension

This ensures that:

* Explicitly scoped variables are **always** detected correctly
* Named variables are detected even without scopes
* Scope takes **precedence** over naming (if a variable has `CORNER_RADIUS` scope but is named "padding", it's still detected as a radius)

## Benefits

### For Designers

* ✅ Use Figma's native `CORNER_RADIUS` scope for automatic detection
* ✅ Name variables naturally (e.g., "button-radius", "corner-small")
* ✅ Add descriptions with "radius" for extra clarity

### For Developers

* ✅ Distinguish radius from other dimensions in exported tokens
* ✅ Filter/process radius values separately if needed
* ✅ Trace back to Figma scope information via `$extensions`

### For Token Systems

* ✅ Maintain semantic meaning of radius values
* ✅ Properly categorize tokens by purpose
* ✅ Enable radius-specific validation or processing

## Testing

The plugin includes comprehensive tests for radius detection:

```bash
# Run radius detection tests
pnpm test test/radius-detection.test.ts

# Run all tests
pnpm test
```

**Test coverage includes:**

* ✅ CORNER\_RADIUS scope detection
* ✅ Keyword detection (radius, corner-radius, border-radius, rounded, corner)
* ✅ Description-based detection
* ✅ Precedence rules (scope > keywords)
* ✅ Non-radius dimension handling

## Migration Guide

If you're using existing Figma variables:

### Recommended Approach

1. **Assign CORNER\_RADIUS scope** to radius variables in Figma (most reliable)
2. **Name variables** with radius keywords (fallback method)
3. **Re-export tokens** to get updated detection results

### Quick Check

After exporting, radius tokens should have:

* `$type: "dimension"` in DTCG format
* Scope information in `$extensions.com.figma.scopes`
* Detection reason in `$extensions.com.figma.detectionReason` (if metadata is enabled)

## Code Changes

### Files Modified

* `src/shared/types.ts` - Added `borderRadius` schema
* `src/mapping/typeDetector.ts` - Enhanced radius detection logic
* `src/mapping/schemaMapper.ts` - Added borderRadius schema mapping
* `test/radius-detection.test.ts` - New comprehensive test suite

### API Impact

* ✅ **Backward compatible** - existing exports still work
* ✅ **Additive only** - no breaking changes
* ✅ **Opt-in improvement** - works automatically with proper variable setup

## Future Enhancements

Potential improvements for future versions:

* Support for multi-value radius (e.g., `8px 8px 0 0` for top corners only)
* Radius-specific validation rules
* Component-level radius recommendations
* Border radius composition/calculation utilities

## Support

For issues or questions about radius detection:

1. Check that variables have `CORNER_RADIUS` scope or radius keywords
2. Enable metadata export to see detection reasons
3. Review test cases in `test/radius-detection.test.ts`
4. File an issue with example Figma variables

***

**Version:** 1.0.0 (Enhanced Radius Detection)
**Last Updated:** 2024-11
