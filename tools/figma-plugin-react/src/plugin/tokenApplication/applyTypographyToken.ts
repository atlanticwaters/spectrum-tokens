export interface TypographyToken {
  fontFamily?: string;
  fontWeight?: number | string;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
}

export function mapWeightToStyle(weight?: number | string): string {
  if (!weight) return 'Regular';

  const weightMap: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };

  if (typeof weight === 'number') {
    return weightMap[weight] || 'Regular';
  }

  return weight;
}

export async function applyTypographyToken(
  node: SceneNode,
  value: TypographyToken
): Promise<void> {
  // Only apply to text nodes
  if (node.type !== 'TEXT') {
    throw new Error('Typography tokens can only be applied to text nodes');
  }

  const textNode = node as TextNode;

  // Load font before making changes
  if (value.fontFamily) {
    const fontStyle = mapWeightToStyle(value.fontWeight);
    try {
      await figma.loadFontAsync({
        family: value.fontFamily,
        style: fontStyle,
      });

      textNode.fontName = {
        family: value.fontFamily,
        style: fontStyle,
      };
    } catch (error) {
      throw new Error(
        `Failed to load font: ${value.fontFamily} ${fontStyle}. Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // Apply font size
  if (value.fontSize !== undefined) {
    textNode.fontSize = value.fontSize;
  }

  // Apply line height
  if (value.lineHeight !== undefined) {
    if (typeof value.lineHeight === 'number') {
      textNode.lineHeight = { value: value.lineHeight, unit: 'PIXELS' };
    } else if (value.lineHeight === 'AUTO') {
      textNode.lineHeight = { unit: 'AUTO' };
    } else if (typeof value.lineHeight === 'string' && value.lineHeight.endsWith('%')) {
      const percentValue = parseFloat(value.lineHeight);
      textNode.lineHeight = { value: percentValue, unit: 'PERCENT' };
    }
  }

  // Apply letter spacing
  if (value.letterSpacing !== undefined) {
    if (typeof value.letterSpacing === 'number') {
      textNode.letterSpacing = { value: value.letterSpacing, unit: 'PIXELS' };
    } else if (typeof value.letterSpacing === 'string' && value.letterSpacing.endsWith('%')) {
      const percentValue = parseFloat(value.letterSpacing);
      textNode.letterSpacing = { value: percentValue, unit: 'PERCENT' };
    }
  }
}
