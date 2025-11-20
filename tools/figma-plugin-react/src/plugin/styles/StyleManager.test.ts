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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { StyleManager } from './StyleManager';

// Mock Figma API
const mockPaintStyle = {
  id: 'paint-1',
  name: 'Primary Color',
  type: 'PAINT' as const,
  paints: [] as Paint[],
};

const mockTextStyle = {
  id: 'text-1',
  name: 'Heading',
  type: 'TEXT' as const,
  fontName: { family: 'Inter', style: 'Regular' },
  fontSize: 24,
  lineHeight: { value: 32, unit: 'PIXELS' as const },
  letterSpacing: { value: 0, unit: 'PIXELS' as const },
};

const mockEffectStyle = {
  id: 'effect-1',
  name: 'Shadow',
  type: 'EFFECT' as const,
  effects: [] as Effect[],
};

(global as any).figma = {
  createPaintStyle: jest.fn(() => mockPaintStyle),
  createTextStyle: jest.fn(() => mockTextStyle),
  createEffectStyle: jest.fn(() => mockEffectStyle),
  getStyleById: jest.fn((id: string) => {
    if (id === 'paint-1') return mockPaintStyle;
    if (id === 'text-1') return mockTextStyle;
    if (id === 'effect-1') return mockEffectStyle;
    return null;
  }),
  getLocalPaintStyles: jest.fn(() => [mockPaintStyle]),
  getLocalTextStyles: jest.fn(() => [mockTextStyle]),
  getLocalEffectStyles: jest.fn(() => [mockEffectStyle]),
  loadFontAsync: jest.fn(),
  mixed: Symbol('mixed') as typeof figma.mixed,
} as any;

describe('StyleManager', () => {
  let manager: StyleManager;

  beforeEach(() => {
    manager = new StyleManager();
    jest.clearAllMocks();
  });

  describe('createStyleFromToken', () => {
    describe('PAINT styles', () => {
      it('creates paint style with hex color', async () => {
        const styleId = await manager.createStyleFromToken({
          name: 'Primary',
          type: 'PAINT',
          value: '#ff0000',
        });

        expect(figma.createPaintStyle).toHaveBeenCalled();
        expect(mockPaintStyle.name).toBe('Primary');
        expect(mockPaintStyle.paints).toHaveLength(1);
        expect(mockPaintStyle.paints[0]).toEqual({
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0 },
          opacity: 1,
        });
        expect(styleId).toBe('paint-1');
      });

      it('creates paint style with hex color with alpha', async () => {
        await manager.createStyleFromToken({
          name: 'Semi-transparent',
          type: 'PAINT',
          value: '#ff000080',
        });

        expect(mockPaintStyle.paints[0]).toMatchObject({
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0 },
          opacity: expect.closeTo(0.5, 2),
        });
      });

      it('creates paint style with rgb color', async () => {
        await manager.createStyleFromToken({
          name: 'RGB Color',
          type: 'PAINT',
          value: 'rgb(128, 64, 32)',
        });

        const paint = mockPaintStyle.paints[0] as SolidPaint;
        expect(paint.color.r).toBeCloseTo(0.502, 2);
        expect(paint.color.g).toBeCloseTo(0.251, 2);
        expect(paint.color.b).toBeCloseTo(0.125, 2);
      });

      it('creates paint style with rgba color', async () => {
        await manager.createStyleFromToken({
          name: 'RGBA Color',
          type: 'PAINT',
          value: 'rgba(255, 0, 0, 0.5)',
        });

        expect(mockPaintStyle.paints[0]).toMatchObject({
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0 },
          opacity: 0.5,
        });
      });
    });

    describe('TEXT styles', () => {
      it('creates text style with font properties', async () => {
        await manager.createStyleFromToken({
          name: 'Heading 1',
          type: 'TEXT',
          value: {
            fontFamily: 'Inter',
            fontStyle: 'Bold',
            fontSize: 32,
            lineHeight: 40,
            letterSpacing: -0.5,
          },
        });

        expect(figma.createTextStyle).toHaveBeenCalled();
        expect(figma.loadFontAsync).toHaveBeenCalledWith({
          family: 'Inter',
          style: 'Bold',
        });
        expect(mockTextStyle.fontName).toEqual({ family: 'Inter', style: 'Bold' });
        expect(mockTextStyle.fontSize).toBe(32);
        expect(mockTextStyle.lineHeight).toEqual({ value: 40, unit: 'PIXELS' });
        expect(mockTextStyle.letterSpacing).toEqual({ value: -0.5, unit: 'PIXELS' });
      });

      it('creates text style with default font style', async () => {
        await manager.createStyleFromToken({
          name: 'Body',
          type: 'TEXT',
          value: {
            fontFamily: 'Arial',
            fontSize: 16,
          },
        });

        expect(figma.loadFontAsync).toHaveBeenCalledWith({
          family: 'Arial',
          style: 'Regular',
        });
      });

      it('creates text style with partial properties', async () => {
        await manager.createStyleFromToken({
          name: 'Caption',
          type: 'TEXT',
          value: {
            fontSize: 12,
          },
        });

        expect(figma.createTextStyle).toHaveBeenCalled();
        expect(mockTextStyle.fontSize).toBe(12);
      });
    });

    describe('EFFECT styles', () => {
      it('creates drop shadow effect', async () => {
        await manager.createStyleFromToken({
          name: 'Drop Shadow',
          type: 'EFFECT',
          value: {
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.3 },
            offset: { x: 0, y: 4 },
            radius: 8,
          },
        });

        expect(figma.createEffectStyle).toHaveBeenCalled();
        expect(mockEffectStyle.effects).toHaveLength(1);
        expect(mockEffectStyle.effects[0]).toMatchObject({
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.3 },
          offset: { x: 0, y: 4 },
          radius: 8,
        });
      });

      it('creates inner shadow effect', async () => {
        await manager.createStyleFromToken({
          name: 'Inner Shadow',
          type: 'EFFECT',
          value: {
            type: 'INNER_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.2 },
            offset: { x: 0, y: 2 },
            radius: 4,
          },
        });

        expect(mockEffectStyle.effects[0]).toMatchObject({
          type: 'INNER_SHADOW',
        });
      });

      it('uses default values for missing effect properties', async () => {
        await manager.createStyleFromToken({
          name: 'Default Shadow',
          type: 'EFFECT',
          value: {
            type: 'DROP_SHADOW',
          },
        });

        expect(mockEffectStyle.effects[0]).toMatchObject({
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.25 },
          offset: { x: 0, y: 4 },
          radius: 4,
        });
      });

      it('handles effect type with dash notation', async () => {
        await manager.createStyleFromToken({
          name: 'Shadow',
          type: 'EFFECT',
          value: {
            type: 'drop-shadow',
          },
        });

        expect(mockEffectStyle.effects[0].type).toBe('DROP_SHADOW');
      });
    });

    describe('error handling', () => {
      it('throws error for unsupported style type', async () => {
        await expect(
          manager.createStyleFromToken({
            name: 'Invalid',
            type: 'INVALID' as any,
            value: {},
          })
        ).rejects.toThrow('Unsupported style type: INVALID');
      });

      it('wraps creation errors with context', async () => {
        (figma.createPaintStyle as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Creation failed');
        });

        await expect(
          manager.createStyleFromToken({
            name: 'Failing Style',
            type: 'PAINT',
            value: '#ff0000',
          })
        ).rejects.toThrow('Failed to create style "Failing Style": Creation failed');
      });
    });
  });

  describe('updateStyle', () => {
    it('updates paint style', async () => {
      await manager.updateStyle('paint-1', '#00ff00');

      expect(mockPaintStyle.paints[0]).toEqual({
        type: 'SOLID',
        color: { r: 0, g: 1, b: 0 },
        opacity: 1,
      });
    });

    it('updates text style', async () => {
      await manager.updateStyle('text-1', {
        fontFamily: 'Roboto',
        fontSize: 18,
      });

      expect(figma.loadFontAsync).toHaveBeenCalledWith({
        family: 'Roboto',
        style: 'Regular',
      });
      expect(mockTextStyle.fontSize).toBe(18);
    });

    it('updates effect style', async () => {
      await manager.updateStyle('effect-1', {
        type: 'DROP_SHADOW',
        radius: 12,
      });

      expect(mockEffectStyle.effects[0]).toMatchObject({
        type: 'DROP_SHADOW',
        radius: 12,
      });
    });

    it('throws error when style not found', async () => {
      await expect(manager.updateStyle('nonexistent', '#ff0000')).rejects.toThrow(
        'Style not found: nonexistent'
      );
    });
  });

  describe('pullStyles', () => {
    it('pulls all local styles', async () => {
      const styles = await manager.pullStyles();

      expect(figma.getLocalPaintStyles).toHaveBeenCalled();
      expect(figma.getLocalTextStyles).toHaveBeenCalled();
      expect(figma.getLocalEffectStyles).toHaveBeenCalled();

      expect(styles).toHaveProperty('Primary Color');
      expect(styles).toHaveProperty('Heading');
      expect(styles).toHaveProperty('Shadow');
    });

    it('converts paint styles correctly', async () => {
      mockPaintStyle.paints = [
        {
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0 },
          opacity: 1,
        },
      ];

      const styles = await manager.pullStyles();

      expect(styles['Primary Color']).toEqual({
        type: 'color',
        value: '#ff0000',
        styleId: 'paint-1',
      });
    });

    it('converts text styles correctly', async () => {
      const styles = await manager.pullStyles();

      expect(styles['Heading']).toEqual({
        type: 'typography',
        value: {
          fontFamily: 'Inter',
          fontStyle: 'Regular',
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: 0,
        },
        styleId: 'text-1',
      });
    });

    it('handles mixed text style properties', async () => {
      const mixedTextStyle = {
        ...mockTextStyle,
        fontName: figma.mixed,
        fontSize: figma.mixed,
      };

      (figma.getLocalTextStyles as jest.Mock).mockReturnValueOnce([mixedTextStyle]);

      const styles = await manager.pullStyles();

      expect(styles['Heading'].value.fontFamily).toBeUndefined();
      expect(styles['Heading'].value.fontSize).toBeUndefined();
    });
  });

  describe('syncStyles', () => {
    it('creates new styles', async () => {
      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);

      const result = await manager.syncStyles({
        'New Color': {
          type: 'color',
          value: '#0000ff',
        },
        'New Typography': {
          type: 'typography',
          value: { fontSize: 20 },
        },
      });

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('updates existing styles', async () => {
      const result = await manager.syncStyles({
        'Primary Color': {
          type: 'color',
          value: '#00ff00',
        },
      });

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('handles mix of new and existing styles', async () => {
      const result = await manager.syncStyles({
        'Primary Color': {
          type: 'color',
          value: '#00ff00',
        },
        'New Color': {
          type: 'color',
          value: '#0000ff',
        },
      });

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('collects errors without stopping sync', async () => {
      (figma.createPaintStyle as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to create');
      });

      const result = await manager.syncStyles({
        'Failing Style': {
          type: 'color',
          value: '#ff0000',
        },
        'Primary Color': {
          type: 'color',
          value: '#00ff00',
        },
      });

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        name: 'Failing Style',
        error: expect.stringContaining('Failed to create'),
      });
    });

    it('maps token types to style types correctly', async () => {
      await manager.syncStyles({
        'Color Token': { type: 'color', value: '#ff0000' },
        'Typography Token': { type: 'typography', value: { fontSize: 16 } },
        'Shadow Token': { type: 'shadow', value: { type: 'DROP_SHADOW' } },
        'Effect Token': { type: 'effect', value: { type: 'INNER_SHADOW' } },
      });

      expect(figma.createPaintStyle).toHaveBeenCalledTimes(1);
      expect(figma.createTextStyle).toHaveBeenCalledTimes(1);
      expect(figma.createEffectStyle).toHaveBeenCalledTimes(2);
    });
  });

  describe('color parsing', () => {
    it('parses 6-digit hex correctly', async () => {
      await manager.createStyleFromToken({
        name: 'Test',
        type: 'PAINT',
        value: '#ff8800',
      });

      const paint = mockPaintStyle.paints[0] as SolidPaint;
      expect(paint.color.r).toBeCloseTo(1, 2);
      expect(paint.color.g).toBeCloseTo(0.533, 2);
      expect(paint.color.b).toBeCloseTo(0, 2);
    });

    it('defaults to black for invalid colors', async () => {
      await manager.createStyleFromToken({
        name: 'Test',
        type: 'PAINT',
        value: 'invalid-color',
      });

      expect(mockPaintStyle.paints[0]).toMatchObject({
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0 },
      });
    });
  });

  describe('integration scenarios', () => {
    it('handles complete style management workflow', async () => {
      // Pull existing styles
      const existingStyles = await manager.pullStyles();
      expect(Object.keys(existingStyles)).toHaveLength(3);

      // Sync with new tokens
      const syncResult = await manager.syncStyles({
        'Primary Color': {
          type: 'color',
          value: '#00ff00', // Update existing
        },
        'New Color': {
          type: 'color',
          value: '#0000ff', // Create new
        },
      });

      expect(syncResult.created).toBe(1);
      expect(syncResult.updated).toBe(1);
      expect(syncResult.errors).toHaveLength(0);
    });

    it('handles empty token set gracefully', async () => {
      const result = await manager.syncStyles({});

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
