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

export interface CreateStyleOptions {
  name: string;
  type: 'PAINT' | 'TEXT' | 'EFFECT';
  value: any;
}

export interface StyleSyncResult {
  created: number;
  updated: number;
  errors: Array<{ name: string; error: string }>;
}

export class StyleManager {
  /**
   * Create a Figma style from a token
   */
  async createStyleFromToken(options: CreateStyleOptions): Promise<string> {
    const { name, type, value } = options;

    try {
      let style: PaintStyle | TextStyle | EffectStyle;

      switch (type) {
        case 'PAINT':
          style = figma.createPaintStyle();
          style.paints = this.convertToPaints(value);
          break;

        case 'TEXT':
          style = figma.createTextStyle();
          await this.applyTextStyle(style, value);
          break;

        case 'EFFECT':
          style = figma.createEffectStyle();
          style.effects = this.convertToEffects(value);
          break;

        default:
          throw new Error(`Unsupported style type: ${type}`);
      }

      style.name = name;
      return style.id;
    } catch (error) {
      throw new Error(
        `Failed to create style "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing Figma style
   */
  async updateStyle(styleId: string, value: any): Promise<void> {
    const style = figma.getStyleById(styleId);
    if (!style) {
      throw new Error(`Style not found: ${styleId}`);
    }

    if (style.type === 'PAINT') {
      (style as PaintStyle).paints = this.convertToPaints(value);
    } else if (style.type === 'TEXT') {
      await this.applyTextStyle(style as TextStyle, value);
    } else if (style.type === 'EFFECT') {
      (style as EffectStyle).effects = this.convertToEffects(value);
    }
  }

  /**
   * Pull all local styles from Figma
   */
  async pullStyles(): Promise<Record<string, any>> {
    const paintStyles = figma.getLocalPaintStyles();
    const textStyles = figma.getLocalTextStyles();
    const effectStyles = figma.getLocalEffectStyles();

    const styles: Record<string, any> = {};

    for (const style of paintStyles) {
      styles[style.name] = {
        type: 'color',
        value: this.convertPaintToValue(style.paints[0]),
        styleId: style.id,
      };
    }

    for (const style of textStyles) {
      styles[style.name] = {
        type: 'typography',
        value: this.convertTextStyleToValue(style),
        styleId: style.id,
      };
    }

    for (const style of effectStyles) {
      styles[style.name] = {
        type: 'effect',
        value: this.convertEffectToValue(style.effects[0]),
        styleId: style.id,
      };
    }

    return styles;
  }

  /**
   * Sync tokens to Figma styles (create or update)
   */
  async syncStyles(tokens: Record<string, any>): Promise<StyleSyncResult> {
    const result: StyleSyncResult = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const [name, token] of Object.entries(tokens)) {
      try {
        // Check if style exists
        const existingStyle = this.findStyleByName(name);

        if (existingStyle) {
          await this.updateStyle(existingStyle.id, token.value);
          result.updated++;
        } else {
          const styleType = this.getStyleType(token.type);
          await this.createStyleFromToken({
            name,
            type: styleType,
            value: token.value,
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Convert a value to Figma Paint array
   */
  private convertToPaints(value: any): Paint[] {
    if (typeof value === 'string') {
      // Parse color string
      const rgba = this.parseColor(value);
      return [
        {
          type: 'SOLID',
          color: { r: rgba.r, g: rgba.g, b: rgba.b },
          opacity: rgba.a ?? 1,
        },
      ];
    }
    return [];
  }

  /**
   * Apply text style properties
   */
  private async applyTextStyle(style: TextStyle, value: any): Promise<void> {
    if (value.fontFamily) {
      await figma.loadFontAsync({
        family: value.fontFamily,
        style: value.fontStyle || 'Regular',
      });
      style.fontName = {
        family: value.fontFamily,
        style: value.fontStyle || 'Regular',
      };
    }
    if (value.fontSize !== undefined) {
      style.fontSize = value.fontSize;
    }
    if (value.lineHeight !== undefined) {
      style.lineHeight = { value: value.lineHeight, unit: 'PIXELS' };
    }
    if (value.letterSpacing !== undefined) {
      style.letterSpacing = { value: value.letterSpacing, unit: 'PIXELS' };
    }
  }

  /**
   * Convert value to Figma Effect array
   */
  private convertToEffects(value: any): Effect[] {
    // Simplified shadow conversion
    if (value.type === 'DROP_SHADOW' || value.type === 'drop-shadow') {
      return [
        {
          type: 'DROP_SHADOW',
          color: value.color || { r: 0, g: 0, b: 0, a: 0.25 },
          offset: value.offset || { x: 0, y: 4 },
          radius: value.radius || 4,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];
    }
    if (value.type === 'INNER_SHADOW' || value.type === 'inner-shadow') {
      return [
        {
          type: 'INNER_SHADOW',
          color: value.color || { r: 0, g: 0, b: 0, a: 0.25 },
          offset: value.offset || { x: 0, y: 4 },
          radius: value.radius || 4,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];
    }
    return [];
  }

  /**
   * Find a style by name
   */
  private findStyleByName(name: string): BaseStyle | null {
    const allStyles = [
      ...figma.getLocalPaintStyles(),
      ...figma.getLocalTextStyles(),
      ...figma.getLocalEffectStyles(),
    ];
    return allStyles.find((s) => s.name === name) || null;
  }

  /**
   * Get Figma style type from token type
   */
  private getStyleType(tokenType: string): 'PAINT' | 'TEXT' | 'EFFECT' {
    switch (tokenType) {
      case 'color':
        return 'PAINT';
      case 'typography':
        return 'TEXT';
      case 'shadow':
      case 'effect':
        return 'EFFECT';
      default:
        return 'PAINT';
    }
  }

  /**
   * Parse color string to RGBA
   */
  private parseColor(value: string): { r: number; g: number; b: number; a?: number } {
    // Handle hex colors
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }

    // Handle rgb/rgba
    if (value.startsWith('rgb')) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
          a: match[4] ? parseFloat(match[4]) : 1,
        };
      }
    }

    // Default to black
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  /**
   * Convert Figma Paint to string value
   */
  private convertPaintToValue(paint: Paint | undefined): string {
    if (!paint || paint.type !== 'SOLID') return '#000000';
    const { r, g, b } = paint.color;
    const a = paint.opacity ?? 1;
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ''}`;
  }

  /**
   * Convert Figma TextStyle to value object
   */
  private convertTextStyleToValue(style: TextStyle): any {
    const fontName = style.fontName !== (figma.mixed as any) && typeof style.fontName === 'object'
      ? style.fontName
      : undefined;

    return {
      fontFamily: fontName?.family,
      fontStyle: fontName?.style,
      fontSize: style.fontSize !== (figma.mixed as any) && typeof style.fontSize === 'number' ? style.fontSize : undefined,
      lineHeight:
        style.lineHeight !== (figma.mixed as any) && typeof style.lineHeight === 'object' && 'value' in style.lineHeight
          ? style.lineHeight.value
          : undefined,
      letterSpacing:
        style.letterSpacing !== (figma.mixed as any) && typeof style.letterSpacing === 'object' && 'value' in style.letterSpacing
          ? style.letterSpacing.value
          : undefined,
    };
  }

  /**
   * Convert Figma Effect to value object
   */
  private convertEffectToValue(effect: Effect | undefined): any {
    if (!effect) return {};
    return {
      type: effect.type,
      color: 'color' in effect ? effect.color : undefined,
      offset: 'offset' in effect ? effect.offset : undefined,
      radius: 'radius' in effect ? effect.radius : undefined,
    };
  }
}
