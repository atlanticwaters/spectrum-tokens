/**
 * Token Validation Utilities
 * Provides comprehensive validation for all token types
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates a color token value
 * Supports: hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(a), hsl(a), and named colors
 */
export function validateColorToken(value: string): ValidationResult {
  if (value === null || value === undefined || typeof value !== 'string') {
    return {
      isValid: false,
      error: 'Color value is required and must be a string',
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return {
      isValid: false,
      error: 'Color value cannot be empty',
    };
  }

  // Hex color validation
  if (trimmedValue.startsWith('#')) {
    const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    if (!hexPattern.test(trimmedValue)) {
      return {
        isValid: false,
        error: 'Invalid hex color format. Use #RGB, #RRGGBB, or #RRGGBBAA',
      };
    }
    return { isValid: true };
  }

  // RGB/RGBA validation
  if (trimmedValue.startsWith('rgb')) {
    const rgbPattern = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*([0-9]*\.?[0-9]+)\s*)?\)$/;
    const match = trimmedValue.match(rgbPattern);

    if (!match) {
      return {
        isValid: false,
        error: 'Invalid RGB(A) format. Use rgb(r, g, b) or rgba(r, g, b, a)',
      };
    }

    const [, r, g, b, , a] = match;
    const rNum = parseInt(r);
    const gNum = parseInt(g);
    const bNum = parseInt(b);

    if (rNum < 0 || rNum > 255 || gNum < 0 || gNum > 255 || bNum < 0 || bNum > 255) {
      return {
        isValid: false,
        error: 'RGB values must be between 0 and 255',
      };
    }

    if (a !== undefined) {
      const aNum = parseFloat(a);
      if (isNaN(aNum) || aNum < 0 || aNum > 1) {
        return {
          isValid: false,
          error: 'Alpha value must be between 0 and 1',
        };
      }
    }

    return { isValid: true };
  }

  // HSL/HSLA validation
  if (trimmedValue.startsWith('hsl')) {
    const hslPattern = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*(,\s*([0-9]*\.?[0-9]+)\s*)?\)$/;
    const match = trimmedValue.match(hslPattern);

    if (!match) {
      return {
        isValid: false,
        error: 'Invalid HSL(A) format. Use hsl(h, s%, l%) or hsla(h, s%, l%, a)',
      };
    }

    const [, h, s, l, , a] = match;
    const hNum = parseInt(h);
    const sNum = parseInt(s);
    const lNum = parseInt(l);

    if (hNum < 0 || hNum > 360) {
      return {
        isValid: false,
        error: 'Hue must be between 0 and 360',
      };
    }

    if (sNum < 0 || sNum > 100 || lNum < 0 || lNum > 100) {
      return {
        isValid: false,
        error: 'Saturation and Lightness must be between 0 and 100',
      };
    }

    if (a !== undefined) {
      const aNum = parseFloat(a);
      if (isNaN(aNum) || aNum < 0 || aNum > 1) {
        return {
          isValid: false,
          error: 'Alpha value must be between 0 and 1',
        };
      }
    }

    return { isValid: true };
  }

  // Named color validation
  const namedColorPattern = /^[a-z]+$/i;
  if (namedColorPattern.test(trimmedValue)) {
    const warnings = [];

    // Common CSS named colors (subset for validation)
    const commonNamedColors = [
      'transparent', 'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange',
      'purple', 'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'navy', 'teal',
      'lime', 'aqua', 'silver', 'maroon', 'olive', 'fuchsia',
    ];

    if (!commonNamedColors.includes(trimmedValue.toLowerCase())) {
      warnings.push('Color name may not be recognized by all systems. Consider using hex or rgb format.');
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  return {
    isValid: false,
    error: 'Invalid color format. Use hex (#RRGGBB), rgb(r, g, b), hsl(h, s%, l%), or a named color',
  };
}

/**
 * Validates a dimension token value
 * Supports: numbers with optional units (px, rem, em, %)
 */
export function validateDimensionToken(value: string | number): ValidationResult {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: 'Dimension value is required',
    };
  }

  // Handle numeric values
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      return {
        isValid: false,
        error: 'Dimension value must be a valid number',
      };
    }
    if (value < 0) {
      return {
        isValid: false,
        error: 'Dimension value cannot be negative',
      };
    }
    return { isValid: true };
  }

  // Handle string values
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: 'Dimension value must be a number or string',
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue === '') {
    return {
      isValid: false,
      error: 'Dimension value cannot be empty',
    };
  }

  // Check for number with optional unit
  const dimensionPattern = /^(-?\d+(?:\.\d+)?)(px|rem|em|%)?$/;
  const match = trimmedValue.match(dimensionPattern);

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid dimension format. Use a number with optional unit (px, rem, em, %)',
    };
  }

  const [, numPart, unit] = match;
  const num = parseFloat(numPart);

  if (isNaN(num) || !isFinite(num)) {
    return {
      isValid: false,
      error: 'Dimension value must be a valid number',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      error: 'Dimension value cannot be negative',
    };
  }

  const warnings = [];

  if (!unit) {
    warnings.push('Consider specifying a unit (px, rem, em, %) for clarity');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Typography value interface
 */
export interface TypographyValue {
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  lineHeight?: string | number;
  letterSpacing?: string | number;
  fontStyle?: string;
}

/**
 * Validates a typography token value
 */
export function validateTypographyToken(value: TypographyValue): ValidationResult {
  if (!value || typeof value !== 'object') {
    return {
      isValid: false,
      error: 'Typography value must be an object',
    };
  }

  const warnings: string[] = [];

  // Font family validation
  if (value.fontFamily !== undefined) {
    if (typeof value.fontFamily !== 'string' || value.fontFamily.trim() === '') {
      return {
        isValid: false,
        error: 'Font family must be a non-empty string',
      };
    }
  } else {
    warnings.push('Font family is recommended for typography tokens');
  }

  // Font size validation
  if (value.fontSize !== undefined) {
    const sizeValidation = validateDimensionToken(value.fontSize);
    if (!sizeValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid font size: ${sizeValidation.error}`,
      };
    }
  }

  // Font weight validation
  if (value.fontWeight !== undefined) {
    const weightValidation = validateFontWeightValue(value.fontWeight);
    if (!weightValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid font weight: ${weightValidation.error}`,
      };
    }
  }

  // Line height validation
  if (value.lineHeight !== undefined) {
    const lhValidation = validateLineHeightValue(value.lineHeight);
    if (!lhValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid line height: ${lhValidation.error}`,
      };
    }
  }

  // Letter spacing validation
  if (value.letterSpacing !== undefined) {
    const lsValidation = validateDimensionToken(value.letterSpacing);
    if (!lsValidation.isValid) {
      return {
        isValid: false,
        error: `Invalid letter spacing: ${lsValidation.error}`,
      };
    }
  }

  // Font style validation
  if (value.fontStyle !== undefined) {
    const validStyles = ['normal', 'italic', 'oblique'];
    if (!validStyles.includes(value.fontStyle.toLowerCase())) {
      return {
        isValid: false,
        error: 'Font style must be normal, italic, or oblique',
      };
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates font weight values
 */
function validateFontWeightValue(value: string | number): ValidationResult {
  if (typeof value === 'number') {
    if (value < 100 || value > 900 || value % 100 !== 0) {
      return {
        isValid: false,
        error: 'Font weight must be between 100-900 in increments of 100',
      };
    }
    return { isValid: true };
  }

  if (typeof value === 'string') {
    const namedWeights = ['normal', 'bold', 'lighter', 'bolder'];
    if (namedWeights.includes(value.toLowerCase())) {
      return { isValid: true };
    }

    const num = parseInt(value);
    if (!isNaN(num)) {
      return validateFontWeightValue(num);
    }

    return {
      isValid: false,
      error: 'Font weight must be a number (100-900) or normal/bold/lighter/bolder',
    };
  }

  return {
    isValid: false,
    error: 'Font weight must be a number or string',
  };
}

/**
 * Validates line height values
 */
function validateLineHeightValue(value: string | number): ValidationResult {
  if (typeof value === 'number') {
    if (value < 0) {
      return {
        isValid: false,
        error: 'Line height cannot be negative',
      };
    }
    return { isValid: true };
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue === 'normal') {
      return { isValid: true };
    }

    // Check for number with optional unit
    const lhPattern = /^(\d+(?:\.\d+)?)(px|rem|em|%)?$/;
    const match = trimmedValue.match(lhPattern);

    if (!match) {
      return {
        isValid: false,
        error: 'Invalid line height format. Use a number, "normal", or number with unit',
      };
    }

    const num = parseFloat(match[1]);
    if (num < 0) {
      return {
        isValid: false,
        error: 'Line height cannot be negative',
      };
    }

    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Line height must be a number or string',
  };
}

/**
 * Shadow value interface
 */
export interface ShadowValue {
  type?: 'drop' | 'inner';
  color: string;
  x: number;
  y: number;
  blur: number;
  spread?: number;
}

/**
 * Validates a shadow token value
 */
export function validateShadowToken(value: ShadowValue | ShadowValue[]): ValidationResult {
  if (!value) {
    return {
      isValid: false,
      error: 'Shadow value is required',
    };
  }

  // Handle array of shadows
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const shadowValidation = validateSingleShadow(value[i]);
      if (!shadowValidation.isValid) {
        return {
          isValid: false,
          error: `Shadow ${i + 1}: ${shadowValidation.error}`,
        };
      }
    }
    return { isValid: true };
  }

  return validateSingleShadow(value);
}

/**
 * Validates a single shadow value
 */
function validateSingleShadow(value: ShadowValue): ValidationResult {
  if (!value || typeof value !== 'object') {
    return {
      isValid: false,
      error: 'Shadow value must be an object',
    };
  }

  // Type validation
  if (value.type && !['drop', 'inner'].includes(value.type)) {
    return {
      isValid: false,
      error: 'Shadow type must be "drop" or "inner"',
    };
  }

  // Color validation
  if (!value.color) {
    return {
      isValid: false,
      error: 'Shadow color is required',
    };
  }

  const colorValidation = validateColorToken(value.color);
  if (!colorValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid shadow color: ${colorValidation.error}`,
    };
  }

  // Offset validation
  if (typeof value.x !== 'number' || isNaN(value.x) || !isFinite(value.x)) {
    return {
      isValid: false,
      error: 'Shadow x offset must be a valid number',
    };
  }

  if (typeof value.y !== 'number' || isNaN(value.y) || !isFinite(value.y)) {
    return {
      isValid: false,
      error: 'Shadow y offset must be a valid number',
    };
  }

  // Blur validation
  if (typeof value.blur !== 'number' || isNaN(value.blur) || !isFinite(value.blur)) {
    return {
      isValid: false,
      error: 'Shadow blur must be a valid number',
    };
  }

  if (value.blur < 0) {
    return {
      isValid: false,
      error: 'Shadow blur cannot be negative',
    };
  }

  // Spread validation (optional)
  if (value.spread !== undefined) {
    if (typeof value.spread !== 'number' || isNaN(value.spread) || !isFinite(value.spread)) {
      return {
        isValid: false,
        error: 'Shadow spread must be a valid number',
      };
    }
  }

  return { isValid: true };
}

/**
 * Border value interface
 */
export interface BorderValue {
  width: string | number;
  style: string;
  color: string;
}

/**
 * Validates a border token value
 */
export function validateBorderToken(value: BorderValue): ValidationResult {
  if (!value || typeof value !== 'object') {
    return {
      isValid: false,
      error: 'Border value must be an object',
    };
  }

  // Width validation
  if (value.width === undefined || value.width === null) {
    return {
      isValid: false,
      error: 'Border width is required',
    };
  }

  const widthValidation = validateDimensionToken(value.width);
  if (!widthValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid border width: ${widthValidation.error}`,
    };
  }

  // Style validation
  if (!value.style || typeof value.style !== 'string') {
    return {
      isValid: false,
      error: 'Border style is required and must be a string',
    };
  }

  const validStyles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none', 'hidden'];
  if (!validStyles.includes(value.style.toLowerCase())) {
    return {
      isValid: false,
      error: `Border style must be one of: ${validStyles.join(', ')}`,
    };
  }

  // Color validation
  if (!value.color) {
    return {
      isValid: false,
      error: 'Border color is required',
    };
  }

  const colorValidation = validateColorToken(value.color);
  if (!colorValidation.isValid) {
    return {
      isValid: false,
      error: `Invalid border color: ${colorValidation.error}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates opacity values (0-1)
 */
export function validateOpacityToken(value: string | number): ValidationResult {
  if (value === null || value === undefined) {
    return {
      isValid: false,
      error: 'Opacity value is required',
    };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) {
    return {
      isValid: false,
      error: 'Opacity must be a valid number',
    };
  }

  if (num < 0 || num > 1) {
    return {
      isValid: false,
      error: 'Opacity must be between 0 and 1',
    };
  }

  return { isValid: true };
}
