import { describe, it, expect } from '@jest/globals';
import { parseColorValue, applyColorToken } from './applyColorToken';

describe('parseColorValue', () => {
  describe('hex colors', () => {
    it('parses 6-digit hex color', () => {
      const result = parseColorValue('#ff0000');
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    it('parses 3-digit hex color', () => {
      const result = parseColorValue('#f00');
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    it('parses 8-digit hex color with alpha', () => {
      const result = parseColorValue('#ff000080');
      expect(result.r).toBeCloseTo(1);
      expect(result.g).toBeCloseTo(0);
      expect(result.b).toBeCloseTo(0);
      expect(result.a).toBeCloseTo(0.5, 2);
    });

    it('parses various hex colors correctly', () => {
      expect(parseColorValue('#00ff00')).toEqual({ r: 0, g: 1, b: 0, a: 1 });
      expect(parseColorValue('#0000ff')).toEqual({ r: 0, g: 0, b: 1, a: 1 });
      expect(parseColorValue('#ffffff')).toEqual({ r: 1, g: 1, b: 1, a: 1 });
      expect(parseColorValue('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    });
  });

  describe('rgb colors', () => {
    it('parses rgb() format', () => {
      const result = parseColorValue('rgb(255, 0, 0)');
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });

    it('parses rgb() with different values', () => {
      const result = parseColorValue('rgb(128, 64, 32)');
      expect(result.r).toBeCloseTo(0.502, 2);
      expect(result.g).toBeCloseTo(0.251, 2);
      expect(result.b).toBeCloseTo(0.125, 2);
      expect(result.a).toBe(1);
    });
  });

  describe('rgba colors', () => {
    it('parses rgba() format', () => {
      const result = parseColorValue('rgba(255, 0, 0, 0.5)');
      expect(result).toEqual({ r: 1, g: 0, b: 0, a: 0.5 });
    });

    it('parses rgba() with full opacity', () => {
      const result = parseColorValue('rgba(128, 128, 128, 1)');
      expect(result.r).toBeCloseTo(0.502, 2);
      expect(result.g).toBeCloseTo(0.502, 2);
      expect(result.b).toBeCloseTo(0.502, 2);
      expect(result.a).toBe(1);
    });

    it('parses rgba() with zero opacity', () => {
      const result = parseColorValue('rgba(255, 255, 255, 0)');
      expect(result).toEqual({ r: 1, g: 1, b: 1, a: 0 });
    });
  });

  describe('error handling', () => {
    it('throws error for unsupported format', () => {
      expect(() => parseColorValue('red')).toThrow('Unsupported color format');
    });

    it('throws error for invalid hex length', () => {
      expect(() => parseColorValue('#ff00')).toThrow('Unsupported color format');
    });

    it('throws error for malformed rgb', () => {
      expect(() => parseColorValue('rgb(255, 0)')).toThrow('Unsupported color format');
    });
  });
});

describe('applyColorToken', () => {
  // Mock Figma API
  const mockNode = {
    fills: [],
    strokes: [],
  };

  beforeEach(() => {
    mockNode.fills = [];
    mockNode.strokes = [];
  });

  it('applies color to fills', async () => {
    await applyColorToken(mockNode as any, '#ff0000');

    expect(mockNode.fills).toHaveLength(1);
    expect(mockNode.fills[0]).toEqual({
      type: 'SOLID',
      color: { r: 1, g: 0, b: 0 },
      opacity: 1,
    });
  });

  it('applies color with alpha to fills', async () => {
    await applyColorToken(mockNode as any, 'rgba(255, 0, 0, 0.5)');

    expect(mockNode.fills).toHaveLength(1);
    expect(mockNode.fills[0]).toEqual({
      type: 'SOLID',
      color: { r: 1, g: 0, b: 0 },
      opacity: 0.5,
    });
  });

  it('applies color to strokes when they exist', async () => {
    mockNode.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] as any;

    await applyColorToken(mockNode as any, '#00ff00');

    expect(mockNode.strokes).toHaveLength(1);
    expect(mockNode.strokes[0]).toEqual({
      type: 'SOLID',
      color: { r: 0, g: 1, b: 0 },
      opacity: 1,
    });
  });

  it('does not add strokes if none exist', async () => {
    mockNode.strokes = [];

    await applyColorToken(mockNode as any, '#ff0000');

    expect(mockNode.strokes).toHaveLength(0);
  });

  it('handles nodes without fill property', async () => {
    const nodeWithoutFills = {};

    // Should not throw
    await expect(applyColorToken(nodeWithoutFills as any, '#ff0000')).resolves.not.toThrow();
  });

  it('handles figma.mixed for fills', async () => {
    const nodeWithMixedFills = {
      fills: (global as any).figma?.mixed || Symbol('mixed'),
      strokes: [],
    };

    // Should not throw
    await expect(
      applyColorToken(nodeWithMixedFills as any, '#ff0000')
    ).resolves.not.toThrow();
  });

  it('handles figma.mixed for strokes', async () => {
    const nodeWithMixedStrokes = {
      fills: [],
      strokes: (global as any).figma?.mixed || Symbol('mixed'),
    };

    // Should not throw
    await expect(
      applyColorToken(nodeWithMixedStrokes as any, '#ff0000')
    ).resolves.not.toThrow();
  });
});
