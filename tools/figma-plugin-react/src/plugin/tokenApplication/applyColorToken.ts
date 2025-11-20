export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export function parseColorValue(value: string): RGBAColor {
  // Support hex colors
  if (value.startsWith('#')) {
    const hex = value.slice(1);

    // Handle 3-digit hex
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      return { r, g, b, a: 1 };
    }

    // Handle 6-digit hex
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b, a: 1 };
    }

    // Handle 8-digit hex with alpha
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return { r, g, b, a };
    }
  }

  // Support rgba(r, g, b, a) format
  if (value.startsWith('rgba(')) {
    const match = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: parseFloat(match[4]),
      };
    }
  }

  // Support rgb(r, g, b) format
  if (value.startsWith('rgb(')) {
    const match = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: 1,
      };
    }
  }

  throw new Error(`Unsupported color format: ${value}`);
}

export async function applyColorToken(node: SceneNode, colorValue: string): Promise<void> {
  const rgba = parseColorValue(colorValue);

  // Apply to fills
  if ('fills' in node && node.fills !== figma.mixed) {
    node.fills = [
      {
        type: 'SOLID',
        color: { r: rgba.r, g: rgba.g, b: rgba.b },
        opacity: rgba.a ?? 1,
      },
    ];
  }

  // Also apply to strokes if applicable
  if ('strokes' in node && Array.isArray(node.strokes)) {
    // Only update if there are existing strokes
    if (node.strokes.length > 0) {
      node.strokes = [
        {
          type: 'SOLID',
          color: { r: rgba.r, g: rgba.g, b: rgba.b },
          opacity: rgba.a ?? 1,
        },
      ];
    }
  }
}
