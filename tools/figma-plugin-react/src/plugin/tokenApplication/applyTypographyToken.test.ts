import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  mapWeightToStyle,
  applyTypographyToken,
  TypographyToken,
} from './applyTypographyToken';

describe('mapWeightToStyle', () => {
  it('returns Regular for undefined weight', () => {
    expect(mapWeightToStyle()).toBe('Regular');
  });

  it('maps numeric weights to style names', () => {
    expect(mapWeightToStyle(100)).toBe('Thin');
    expect(mapWeightToStyle(200)).toBe('ExtraLight');
    expect(mapWeightToStyle(300)).toBe('Light');
    expect(mapWeightToStyle(400)).toBe('Regular');
    expect(mapWeightToStyle(500)).toBe('Medium');
    expect(mapWeightToStyle(600)).toBe('SemiBold');
    expect(mapWeightToStyle(700)).toBe('Bold');
    expect(mapWeightToStyle(800)).toBe('ExtraBold');
    expect(mapWeightToStyle(900)).toBe('Black');
  });

  it('returns Regular for unmapped numeric weights', () => {
    expect(mapWeightToStyle(450)).toBe('Regular');
    expect(mapWeightToStyle(999)).toBe('Regular');
  });

  it('returns string weights as-is', () => {
    expect(mapWeightToStyle('Bold')).toBe('Bold');
    expect(mapWeightToStyle('Italic')).toBe('Italic');
    expect(mapWeightToStyle('Bold Italic')).toBe('Bold Italic');
  });
});

describe('applyTypographyToken', () => {
  // Mock Figma API
  const mockTextNode = {
    type: 'TEXT',
    fontName: { family: 'Inter', style: 'Regular' },
    fontSize: 16,
    lineHeight: { unit: 'AUTO' },
    letterSpacing: { value: 0, unit: 'PIXELS' },
  };

  const mockLoadFontAsync = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<typeof figma.loadFontAsync>;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).figma = {
      loadFontAsync: mockLoadFontAsync,
    };

    // Reset mock node
    mockTextNode.fontName = { family: 'Inter', style: 'Regular' };
    mockTextNode.fontSize = 16;
    mockTextNode.lineHeight = { unit: 'AUTO' };
    mockTextNode.letterSpacing = { value: 0, unit: 'PIXELS' };
  });

  it('throws error for non-text nodes', async () => {
    const nonTextNode = { type: 'RECTANGLE' };

    await expect(applyTypographyToken(nonTextNode as any, {})).rejects.toThrow(
      'Typography tokens can only be applied to text nodes'
    );
  });

  it('applies font family', async () => {
    const token: TypographyToken = {
      fontFamily: 'Roboto',
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockLoadFontAsync).toHaveBeenCalledWith({
      family: 'Roboto',
      style: 'Regular',
    });
    expect(mockTextNode.fontName).toEqual({
      family: 'Roboto',
      style: 'Regular',
    });
  });

  it('applies font family with weight', async () => {
    const token: TypographyToken = {
      fontFamily: 'Roboto',
      fontWeight: 700,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockLoadFontAsync).toHaveBeenCalledWith({
      family: 'Roboto',
      style: 'Bold',
    });
    expect(mockTextNode.fontName).toEqual({
      family: 'Roboto',
      style: 'Bold',
    });
  });

  it('applies font family with string weight', async () => {
    const token: TypographyToken = {
      fontFamily: 'Roboto',
      fontWeight: 'Bold Italic',
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockLoadFontAsync).toHaveBeenCalledWith({
      family: 'Roboto',
      style: 'Bold Italic',
    });
    expect(mockTextNode.fontName).toEqual({
      family: 'Roboto',
      style: 'Bold Italic',
    });
  });

  it('applies font size', async () => {
    const token: TypographyToken = {
      fontSize: 24,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.fontSize).toBe(24);
  });

  it('applies line height in pixels', async () => {
    const token: TypographyToken = {
      lineHeight: 32,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.lineHeight).toEqual({ value: 32, unit: 'PIXELS' });
  });

  it('applies line height as AUTO', async () => {
    const token: TypographyToken = {
      lineHeight: 'AUTO',
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.lineHeight).toEqual({ unit: 'AUTO' });
  });

  it('applies line height as percentage', async () => {
    const token: TypographyToken = {
      lineHeight: '150%',
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.lineHeight).toEqual({ value: 150, unit: 'PERCENT' });
  });

  it('applies letter spacing in pixels', async () => {
    const token: TypographyToken = {
      letterSpacing: 2,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.letterSpacing).toEqual({ value: 2, unit: 'PIXELS' });
  });

  it('applies letter spacing as percentage', async () => {
    const token: TypographyToken = {
      letterSpacing: '5%',
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.letterSpacing).toEqual({ value: 5, unit: 'PERCENT' });
  });

  it('applies all typography properties', async () => {
    const token: TypographyToken = {
      fontFamily: 'Arial',
      fontWeight: 600,
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 1.5,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockLoadFontAsync).toHaveBeenCalledWith({
      family: 'Arial',
      style: 'SemiBold',
    });
    expect(mockTextNode.fontName).toEqual({
      family: 'Arial',
      style: 'SemiBold',
    });
    expect(mockTextNode.fontSize).toBe(20);
    expect(mockTextNode.lineHeight).toEqual({ value: 28, unit: 'PIXELS' });
    expect(mockTextNode.letterSpacing).toEqual({ value: 1.5, unit: 'PIXELS' });
  });

  it('handles font loading error', async () => {
    mockLoadFontAsync.mockRejectedValueOnce(new Error('Font not found') as any);

    const token: TypographyToken = {
      fontFamily: 'NonExistentFont',
    };

    await expect(applyTypographyToken(mockTextNode as any, token)).rejects.toThrow(
      /Failed to load font/
    );
  });

  it('applies only specified properties', async () => {
    const originalFontSize = mockTextNode.fontSize;
    const token: TypographyToken = {
      lineHeight: 24,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.fontSize).toBe(originalFontSize); // Unchanged
    expect(mockTextNode.lineHeight).toEqual({ value: 24, unit: 'PIXELS' });
  });

  it('handles zero values', async () => {
    const token: TypographyToken = {
      fontSize: 0,
      letterSpacing: 0,
    };

    await applyTypographyToken(mockTextNode as any, token);

    expect(mockTextNode.fontSize).toBe(0);
    expect(mockTextNode.letterSpacing).toEqual({ value: 0, unit: 'PIXELS' });
  });
});
