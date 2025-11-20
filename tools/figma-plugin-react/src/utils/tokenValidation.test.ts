import {
  validateColorToken,
  validateDimensionToken,
  validateTypographyToken,
  validateShadowToken,
  validateBorderToken,
  validateOpacityToken,
  TypographyValue,
  ShadowValue,
  BorderValue,
} from './tokenValidation';

describe('validateColorToken', () => {
  describe('valid colors', () => {
    it('should validate 3-digit hex color', () => {
      const result = validateColorToken('#F00');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate 6-digit hex color', () => {
      const result = validateColorToken('#FF0000');
      expect(result.isValid).toBe(true);
    });

    it('should validate 8-digit hex color with alpha', () => {
      const result = validateColorToken('#FF0000FF');
      expect(result.isValid).toBe(true);
    });

    it('should validate lowercase hex color', () => {
      const result = validateColorToken('#ff0000');
      expect(result.isValid).toBe(true);
    });

    it('should validate rgb color', () => {
      const result = validateColorToken('rgb(255, 0, 0)');
      expect(result.isValid).toBe(true);
    });

    it('should validate rgba color', () => {
      const result = validateColorToken('rgba(255, 0, 0, 0.5)');
      expect(result.isValid).toBe(true);
    });

    it('should validate hsl color', () => {
      const result = validateColorToken('hsl(0, 100%, 50%)');
      expect(result.isValid).toBe(true);
    });

    it('should validate hsla color', () => {
      const result = validateColorToken('hsla(0, 100%, 50%, 0.8)');
      expect(result.isValid).toBe(true);
    });

    it('should validate named color', () => {
      const result = validateColorToken('red');
      expect(result.isValid).toBe(true);
    });

    it('should validate common named colors without warning', () => {
      const colors = ['red', 'blue', 'green', 'white', 'black', 'transparent'];
      colors.forEach(color => {
        const result = validateColorToken(color);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toBeUndefined();
      });
    });
  });

  describe('invalid colors', () => {
    it('should reject null/undefined', () => {
      const result = validateColorToken(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value is required and must be a string');
    });

    it('should reject empty string', () => {
      const result = validateColorToken('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Color value cannot be empty');
    });

    it('should reject invalid hex (too many digits)', () => {
      const result = validateColorToken('#FF00001');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid hex color format');
    });

    it('should reject invalid hex (non-hex characters)', () => {
      const result = validateColorToken('#GGGGGG');
      expect(result.isValid).toBe(false);
    });

    it('should reject RGB with values > 255', () => {
      const result = validateColorToken('rgb(300, 0, 0)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('RGB values must be between 0 and 255');
    });

    it('should reject RGB with negative values', () => {
      const result = validateColorToken('rgb(-10, 0, 0)');
      expect(result.isValid).toBe(false);
    });

    it('should reject RGBA with alpha > 1', () => {
      const result = validateColorToken('rgba(255, 0, 0, 1.5)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Alpha value must be between 0 and 1');
    });

    it('should reject HSL with hue > 360', () => {
      const result = validateColorToken('hsl(400, 100%, 50%)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Hue must be between 0 and 360');
    });

    it('should reject HSL with saturation > 100', () => {
      const result = validateColorToken('hsl(180, 150%, 50%)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Saturation and Lightness must be between 0 and 100');
    });

    it('should reject completely invalid format', () => {
      const result = validateColorToken('not-a-color-123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('warnings', () => {
    it('should warn about uncommon named colors', () => {
      const result = validateColorToken('cornflowerblue');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('may not be recognized');
    });
  });
});

describe('validateDimensionToken', () => {
  describe('valid dimensions', () => {
    it('should validate plain number', () => {
      const result = validateDimensionToken(16);
      expect(result.isValid).toBe(true);
    });

    it('should validate zero', () => {
      const result = validateDimensionToken(0);
      expect(result.isValid).toBe(true);
    });

    it('should validate decimal number', () => {
      const result = validateDimensionToken(1.5);
      expect(result.isValid).toBe(true);
    });

    it('should validate number with px unit', () => {
      const result = validateDimensionToken('16px');
      expect(result.isValid).toBe(true);
    });

    it('should validate number with rem unit', () => {
      const result = validateDimensionToken('1.5rem');
      expect(result.isValid).toBe(true);
    });

    it('should validate number with em unit', () => {
      const result = validateDimensionToken('2em');
      expect(result.isValid).toBe(true);
    });

    it('should validate number with % unit', () => {
      const result = validateDimensionToken('50%');
      expect(result.isValid).toBe(true);
    });

    it('should validate string number without unit', () => {
      const result = validateDimensionToken('16');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Consider specifying a unit');
    });
  });

  describe('invalid dimensions', () => {
    it('should reject null/undefined', () => {
      const result = validateDimensionToken(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Dimension value is required');
    });

    it('should reject negative numbers', () => {
      const result = validateDimensionToken(-10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Dimension value cannot be negative');
    });

    it('should reject negative string values', () => {
      const result = validateDimensionToken('-10px');
      expect(result.isValid).toBe(false);
    });

    it('should reject NaN', () => {
      const result = validateDimensionToken(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Dimension value must be a valid number');
    });

    it('should reject Infinity', () => {
      const result = validateDimensionToken(Infinity);
      expect(result.isValid).toBe(false);
    });

    it('should reject empty string', () => {
      const result = validateDimensionToken('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Dimension value cannot be empty');
    });

    it('should reject invalid unit', () => {
      const result = validateDimensionToken('16pt');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid dimension format');
    });

    it('should reject non-numeric string', () => {
      const result = validateDimensionToken('abc');
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateTypographyToken', () => {
  describe('valid typography', () => {
    it('should validate complete typography object', () => {
      const value: TypographyValue = {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: '0.5px',
        fontStyle: 'normal',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate minimal typography object', () => {
      const value: TypographyValue = {
        fontFamily: 'Arial',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate with numeric font size', () => {
      const value: TypographyValue = {
        fontSize: 16,
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate with named font weight', () => {
      const value: TypographyValue = {
        fontWeight: 'bold',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate all font weights from 100-900', () => {
      for (let weight = 100; weight <= 900; weight += 100) {
        const value: TypographyValue = { fontWeight: weight };
        const result = validateTypographyToken(value);
        expect(result.isValid).toBe(true);
      }
    });

    it('should validate italic font style', () => {
      const value: TypographyValue = {
        fontStyle: 'italic',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid typography', () => {
    it('should reject non-object value', () => {
      const result = validateTypographyToken('not an object' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Typography value must be an object');
    });

    it('should reject empty font family', () => {
      const value: TypographyValue = {
        fontFamily: '',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font family must be a non-empty string');
    });

    it('should reject invalid font size', () => {
      const value: TypographyValue = {
        fontSize: '-10px',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid font size');
    });

    it('should reject invalid font weight', () => {
      const value: TypographyValue = {
        fontWeight: 250, // Not a multiple of 100
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid font weight');
    });

    it('should reject font weight > 900', () => {
      const value: TypographyValue = {
        fontWeight: 1000,
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid font style', () => {
      const value: TypographyValue = {
        fontStyle: 'slanted',
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Font style must be normal, italic, or oblique');
    });

    it('should reject negative line height', () => {
      const value: TypographyValue = {
        lineHeight: -1,
      };
      const result = validateTypographyToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid line height');
    });
  });
});

describe('validateShadowToken', () => {
  describe('valid shadows', () => {
    it('should validate complete shadow object', () => {
      const value: ShadowValue = {
        type: 'drop',
        color: '#000000',
        x: 0,
        y: 4,
        blur: 8,
        spread: 2,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate shadow without spread', () => {
      const value: ShadowValue = {
        color: '#000000',
        x: 0,
        y: 4,
        blur: 8,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate shadow without type', () => {
      const value: ShadowValue = {
        color: '#000000',
        x: 0,
        y: 4,
        blur: 8,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate inner shadow', () => {
      const value: ShadowValue = {
        type: 'inner',
        color: 'rgba(0, 0, 0, 0.5)',
        x: 0,
        y: 2,
        blur: 4,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate array of shadows', () => {
      const value: ShadowValue[] = [
        { color: '#000', x: 0, y: 2, blur: 4 },
        { color: '#FFF', x: 0, y: 4, blur: 8 },
      ];
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate negative x offset', () => {
      const value: ShadowValue = {
        color: '#000',
        x: -5,
        y: 0,
        blur: 10,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid shadows', () => {
    it('should reject null/undefined', () => {
      const result = validateShadowToken(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow value is required');
    });

    it('should reject non-object value', () => {
      const result = validateShadowToken('shadow' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow value must be an object');
    });

    it('should reject invalid shadow type', () => {
      const value = {
        type: 'outer',
        color: '#000',
        x: 0,
        y: 0,
        blur: 0,
      } as any;
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow type must be "drop" or "inner"');
    });

    it('should reject missing color', () => {
      const value = {
        x: 0,
        y: 0,
        blur: 0,
      } as any;
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow color is required');
    });

    it('should reject invalid color', () => {
      const value: ShadowValue = {
        color: 'not-a-color',
        x: 0,
        y: 0,
        blur: 0,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid shadow color');
    });

    it('should reject non-numeric x offset', () => {
      const value = {
        color: '#000',
        x: 'five',
        y: 0,
        blur: 0,
      } as any;
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow x offset must be a valid number');
    });

    it('should reject negative blur', () => {
      const value: ShadowValue = {
        color: '#000',
        x: 0,
        y: 0,
        blur: -5,
      };
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Shadow blur cannot be negative');
    });

    it('should reject invalid shadow in array', () => {
      const value = [
        { color: '#000', x: 0, y: 0, blur: 0 },
        { color: 'not-a-color-123', x: 0, y: 0, blur: 0 },
      ];
      const result = validateShadowToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Shadow 2');
    });
  });
});

describe('validateBorderToken', () => {
  describe('valid borders', () => {
    it('should validate complete border object', () => {
      const value: BorderValue = {
        width: '1px',
        style: 'solid',
        color: '#000000',
      };
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate border with numeric width', () => {
      const value: BorderValue = {
        width: 2,
        style: 'solid',
        color: '#000',
      };
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(true);
    });

    it('should validate all border styles', () => {
      const styles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none', 'hidden'];
      styles.forEach(style => {
        const value: BorderValue = {
          width: '1px',
          style,
          color: '#000',
        };
        const result = validateBorderToken(value);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('invalid borders', () => {
    it('should reject non-object value', () => {
      const result = validateBorderToken('border' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Border value must be an object');
    });

    it('should reject missing width', () => {
      const value = {
        style: 'solid',
        color: '#000',
      } as any;
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Border width is required');
    });

    it('should reject invalid width', () => {
      const value: BorderValue = {
        width: '-1px',
        style: 'solid',
        color: '#000',
      };
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid border width');
    });

    it('should reject missing style', () => {
      const value = {
        width: '1px',
        color: '#000',
      } as any;
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Border style is required and must be a string');
    });

    it('should reject invalid style', () => {
      const value: BorderValue = {
        width: '1px',
        style: 'wavy',
        color: '#000',
      };
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Border style must be one of');
    });

    it('should reject missing color', () => {
      const value = {
        width: '1px',
        style: 'solid',
      } as any;
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Border color is required');
    });

    it('should reject invalid color', () => {
      const value: BorderValue = {
        width: '1px',
        style: 'solid',
        color: 'not-a-color',
      };
      const result = validateBorderToken(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid border color');
    });
  });
});

describe('validateOpacityToken', () => {
  describe('valid opacity', () => {
    it('should validate 0', () => {
      const result = validateOpacityToken(0);
      expect(result.isValid).toBe(true);
    });

    it('should validate 1', () => {
      const result = validateOpacityToken(1);
      expect(result.isValid).toBe(true);
    });

    it('should validate 0.5', () => {
      const result = validateOpacityToken(0.5);
      expect(result.isValid).toBe(true);
    });

    it('should validate string number', () => {
      const result = validateOpacityToken('0.75');
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid opacity', () => {
    it('should reject null/undefined', () => {
      const result = validateOpacityToken(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Opacity value is required');
    });

    it('should reject negative value', () => {
      const result = validateOpacityToken(-0.1);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Opacity must be between 0 and 1');
    });

    it('should reject value > 1', () => {
      const result = validateOpacityToken(1.5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Opacity must be between 0 and 1');
    });

    it('should reject NaN', () => {
      const result = validateOpacityToken(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Opacity must be a valid number');
    });

    it('should reject Infinity', () => {
      const result = validateOpacityToken(Infinity);
      expect(result.isValid).toBe(false);
    });

    it('should reject non-numeric string', () => {
      const result = validateOpacityToken('abc');
      expect(result.isValid).toBe(false);
    });
  });
});
