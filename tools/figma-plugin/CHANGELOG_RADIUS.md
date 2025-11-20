# Changelog: Enhanced Radius Detection

## Summary

Implemented comprehensive border radius detection to properly identify and extract corner radius values from Figma variables. The plugin now uses Figma's native `CORNER_RADIUS` scope and keyword detection to distinguish radius values from other dimensions.

## Changes Made

### 1. Type System Updates (`src/shared/types.ts`)

**Added:**

* `borderRadius` schema to `SPECTRUM_SCHEMAS` constant
* Maps to `dimension.json` schema (consistent with Spectrum's approach)

```typescript
export const SPECTRUM_SCHEMAS = {
  // ... existing schemas
  borderRadius: `${SCHEMA_BASE_URL}/dimension.json`, // New
  // ... rest of schemas
}
```

### 2. Type Detector Enhancements (`src/mapping/typeDetector.ts`)

**Added:**

* Separate `borderRadius` pattern in `TYPE_PATTERNS`
* Keywords: `radius`, `corner-radius`, `border-radius`, `rounded`, `corner`

**Modified:**

* Removed `radius` from generic `dimension` patterns
* Enhanced `detectFloatType()` to check for radius **before** other dimensions
* Added two-tier detection:
  1. Check Figma's `CORNER_RADIUS` scope (highest priority)
  2. Check for radius keywords in name/description

**Code changes:**

```typescript
// Check for border radius first (highest priority)
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
```

### 3. Schema Mapper Updates (`src/mapping/schemaMapper.ts`)

**Added:**

* Case for `borderRadius` in schema mapping function

```typescript
case "borderRadius":
  return SPECTRUM_SCHEMAS.borderRadius;
```

### 4. Test Coverage (`test/radius-detection.test.ts`)

**Added 8 comprehensive tests:**

1. ✅ CORNER\_RADIUS scope detection
2. ✅ 'radius' keyword detection
3. ✅ 'border-radius' keyword detection
4. ✅ 'corner' keyword detection
5. ✅ 'rounded' keyword detection
6. ✅ Non-radius dimension handling
7. ✅ Scope precedence over naming
8. ✅ Description-based keyword detection

**Test Results:**

* All 8 new tests pass ✅
* All 72 existing tests still pass ✅
* **Total: 80 tests passing**

### 5. Documentation

**Created:**

* `RADIUS_DETECTION.md` - Comprehensive guide on radius detection
* `CHANGELOG_RADIUS.md` - This file
* Updated `examples/example-export.json` with radius token examples

## Impact

### What's Fixed

✅ Radius values now properly identified via Figma's `CORNER_RADIUS` scope
✅ Radius values distinguished from other dimensions (padding, margin, spacing)
✅ Scope information preserved in token metadata
✅ Multiple detection methods (scope + keywords) for flexibility

### What's Improved

✅ Higher detection accuracy using native Figma scopes
✅ Better semantic token categorization
✅ Clearer exported token structure
✅ Comprehensive test coverage

### What's Maintained

✅ 100% backward compatibility - no breaking changes
✅ All existing tests still pass
✅ Existing token exports unchanged
✅ DTCG and Spectrum format compliance

## Detection Examples

### Example 1: Scope-based Detection

```typescript
// Input Figma Variable
{
  name: "button/border",
  scopes: ["CORNER_RADIUS"],
  value: 8
}

// Output Token
{
  "$type": "dimension",
  "$value": "8px",
  "$extensions": {
    "com.figma": {
      "scopes": ["CORNER_RADIUS"],
      "detectionReason": "Figma CORNER_RADIUS scope detected"
    }
  }
}
```

### Example 2: Keyword-based Detection

```typescript
// Input Figma Variable
{
  name: "corner-radius-100",
  scopes: ["ALL_SCOPES"],
  value: 4
}

// Output Token
{
  "$type": "dimension",
  "$value": "4px",
  "$extensions": {
    "com.figma": {
      "scopes": ["ALL_SCOPES"],
      "detectionReason": "Border radius keywords detected"
    }
  }
}
```

### Example 3: Not a Radius

```typescript
// Input Figma Variable
{
  name: "button/padding",
  scopes: ["ALL_SCOPES"],
  value: 8
}

// Output Token
{
  "$type": "dimension",
  "$value": "8px",
  // No radius detection - correctly identified as generic dimension
}
```

## Usage Recommendations

### For Designers

1. **Preferred:** Assign `CORNER_RADIUS` scope to radius variables in Figma
2. **Alternative:** Name variables with radius keywords (e.g., "button-radius", "corner-small")
3. **Best Practice:** Use both scope + naming for clarity

### For Developers

1. Check `$extensions.com.figma.scopes` to identify radius values
2. Filter tokens by scope information if needed
3. Use `spectrumSchema: "borderRadius"` hint in processing pipelines

## Build & Test

```bash
# Build the plugin
pnpm run build

# Run all tests
pnpm test

# Run only radius detection tests
pnpm test test/radius-detection.test.ts
```

## Files Changed

```
tools/figma-plugin/
├── src/
│   ├── shared/types.ts                    # Added borderRadius schema
│   ├── mapping/
│   │   ├── typeDetector.ts               # Enhanced radius detection
│   │   └── schemaMapper.ts               # Added borderRadius mapping
├── test/
│   └── radius-detection.test.ts          # New test suite (8 tests)
├── examples/
│   └── example-export.json               # Added radius examples
├── RADIUS_DETECTION.md                   # New documentation
└── CHANGELOG_RADIUS.md                   # This file
```

## Migration

No migration required! The changes are:

* ✅ **Backward compatible**
* ✅ **Additive only**
* ✅ **Automatically applied** on next export

Simply re-export your tokens to benefit from improved radius detection.

## Known Limitations

1. Multi-value radius syntax not yet supported (e.g., `8px 8px 0 0`)
2. Radius-specific validation rules not implemented
3. Radius calculations/compositions not available

These may be addressed in future enhancements.

## Verification

To verify the changes work correctly:

1. **Create test variables in Figma:**
   * Variable with `CORNER_RADIUS` scope
   * Variable named "corner-radius-100"
   * Variable named "button/padding" (should NOT be detected as radius)

2. **Export tokens** using the plugin

3. **Check output:**
   * Radius variables should have scope information in `$extensions`
   * Detection reason should indicate "CORNER\_RADIUS scope" or "keywords detected"
   * Padding variables should NOT have radius detection

## Support

If you encounter issues:

1. Verify Figma variables have proper scopes or naming
2. Enable metadata export to see detection reasons
3. Check test cases in `test/radius-detection.test.ts`
4. Review documentation in `RADIUS_DETECTION.md`

***

**Author:** Claude Code
**Date:** 2024-11-19
**Version:** 1.0.0
