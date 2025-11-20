/**
 * Custom Transforms (Composite Support)
 * Handles atomic values (strings/numbers) AND composite objects (Shadows/Typography).
 */
export function registerCustomTransforms(StyleDictionary) {
  const getNumber = (val) => {
    if (typeof val === "object" && val !== null && val.value !== undefined) {
      return getNumber(val.value);
    }
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const cleaned = val.replace(/[^0-9.\-]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const getString = (val) => {
    if (typeof val === "string") return val;
    if (typeof val === "number") return `${val}`;
    if (typeof val === "object" && val !== null && val.value !== undefined) {
      return getString(val.value);
    }
    return "";
  };

  const getTokenValue = (token) => token?.value ?? token?.$value;
  const getTokenType = (token) => token?.$type ?? token?.type ?? "";
  const getPathString = (token) =>
    token?.path ? token.path.join(".").toLowerCase() : "";
  const isFontSizeToken = (token) => {
    const type = getTokenType(token).toLowerCase();
    if (type === "fontsize" || type === "fontsizes") return true;
    const path = getPathString(token);
    return path.includes("font-size");
  };
  const dimensionTypes = [
    "dimension",
    "sizing",
    "spacing",
    "borderRadius",
    "number",
  ];
  const clamp01 = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return Math.min(1, Math.max(0, value));
  };
  const normalizeComponent = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return 0;
    return value > 1 ? clamp01(value / 255) : clamp01(value);
  };
  const byteHex = (value) =>
    Math.round(clamp01(value) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  const formatSwiftComponent = (value) => {
    const clamped = clamp01(value);
    const fixed = clamped.toFixed(3);
    return fixed.replace(/\.?0+$/, "") || "0";
  };

  const normalizeHex = (hex) => {
    if (!hex) return "000000";
    let cleanHex = hex.replace("#", "").trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (cleanHex.length === 6 || cleanHex.length === 8) {
      return cleanHex.toUpperCase();
    }
    return "000000";
  };

  const hexToComponents = (hex) => {
    const cleanHex = normalizeHex(hex);
    const hasAlpha = cleanHex.length === 8;
    const offset = hasAlpha ? 2 : 0;
    const hexPairs = cleanHex.match(/.{1,2}/g) || [];
    const r = parseInt(hexPairs[offset], 16) / 255 || 0;
    const g = parseInt(hexPairs[offset + 1], 16) / 255 || 0;
    const b = parseInt(hexPairs[offset + 2], 16) / 255 || 0;
    const a = hasAlpha ? parseInt(hexPairs[0], 16) / 255 : 1;
    return { red: r, green: g, blue: b, alpha: a };
  };

  const parseColorValue = (token) => {
    const raw = getTokenValue(token);
    if (typeof raw === "string") {
      return { ...hexToComponents(raw), hex: normalizeHex(raw) };
    }

    if (raw && typeof raw === "object") {
      const components = Array.isArray(raw.components) ? raw.components : [];
      let { red, green, blue, alpha } = { red: 0, green: 0, blue: 0, alpha: 1 };

      if (components.length >= 3) {
        [red, green, blue] = components;
        alpha = typeof raw.alpha === "number" ? raw.alpha : components[3];
      } else if (raw.hex) {
        const fromHex = hexToComponents(raw.hex);
        red = fromHex.red;
        green = fromHex.green;
        blue = fromHex.blue;
        alpha = typeof raw.alpha === "number" ? raw.alpha : fromHex.alpha;
      } else {
        alpha = typeof raw.alpha === "number" ? raw.alpha : 1;
      }

      const normalizedRed = normalizeComponent(red);
      const normalizedGreen = normalizeComponent(green);
      const normalizedBlue = normalizeComponent(blue);
      const normalizedAlpha = clamp01(alpha ?? 1);
      const hexSource =
        raw.hex ||
        `${byteHex(normalizedRed)}${byteHex(normalizedGreen)}${byteHex(normalizedBlue)}`;

      return {
        red: normalizedRed,
        green: normalizedGreen,
        blue: normalizedBlue,
        alpha: normalizedAlpha,
        hex: normalizeHex(hexSource),
      };
    }

    return { red: 0, green: 0, blue: 0, alpha: 1, hex: "000000" };
  };

  // -------------------------------------------
  // COMPOSITE HELPERS
  // -------------------------------------------

  // Ensure hex colors from Figma are 6 or 8 digits
  // const normalizeColor = (color) => color || '#000000';

  // -------------------------------------------
  // SHADOW TRANSFORMS
  // -------------------------------------------

  // StyleDictionary.registerTransform({
  //   name: 'hdds/shadow/compose',
  //   type: 'value',
  //   filter: (token) => token.type === 'shadow',
  //   transformer: (token) => {
  //     const { color, offsetX, offsetY, blur } = token.value;
  //     // Kotlin Compose Shadow
  //     // Note: Compose Text and Box shadows differ. This is a generic data object approach.
  //     return `Shadow(color = Color(0x${normalizeColor(color).replace('#', 'FF')}), offset = Offset(${getNumber(offsetX)}f, ${getNumber(offsetY)}f), blurRadius = ${getNumber(blur)}f)`;
  //   }
  // });

  // StyleDictionary.registerTransform({
  //   name: 'hdds/shadow/swift',
  //   type: 'value',
  //   filter: (token) => token.type === 'shadow',
  //   transformer: (token) => {
  //     const { color, offsetX, offsetY, blur } = token.value;
  //     // Returns a simplified struct initializer (Assuming you have a wrapper or extension)
  //     // Standard NSShadow is messy in static lets, so we usually prefer a custom struct.
  //     return `HDDSShadow(color: UIColor(hex: "${color}"), x: ${getNumber(offsetX)}, y: ${getNumber(offsetY)}, blur: ${getNumber(blur)})`;
  //   }
  // });

  // StyleDictionary.registerTransform({
  //   name: 'hdds/shadow/css',
  //   type: 'value',
  //   filter: (token) => token.type === 'shadow',
  //   transformer: (token) => {
  //     const { color, offsetX, offsetY, blur } = token.value;
  //     return `${getNumber(offsetX)}px ${getNumber(offsetY)}px ${getNumber(blur)}px ${color}`;
  //   }
  // });

  // -------------------------------------------
  // TYPOGRAPHY TRANSFORMS
  // -------------------------------------------

  StyleDictionary.registerTransform({
    name: "hdds/typography/compose",
    type: "value",
    filter: (token) => (token.$type ?? token.type) === "typography",
    transform: (token) => {
      const value = getTokenValue(token) ?? {};
      const fontFamily = getString(value.fontFamily)
        .toLowerCase()
        .replace(/ /g, "_");
      const fontSize = value.fontSize;
      const fontWeight = value.fontWeight ?? 400;
      // Compose TextStyle
      return `TextStyle(fontFamily = FontFamily(Font(R.font.${fontFamily})), fontSize = ${getNumber(fontSize)}.sp, fontWeight = FontWeight(${fontWeight}))`;
    },
  });

  StyleDictionary.registerTransform({
    name: "hdds/typography/swift",
    type: "value",
    // transitive: true,
    filter: (token) => (token.$type ?? token.type) === "typography",
    transform: (token) => {
      const value = getTokenValue(token) ?? {};
      const { fontSize, fontWeight } = value;

      // Standard weight mapping from number (DTCG) to SwiftUI enum
      const weightMap = {
        100: ".ultralight",
        200: ".thin",
        300: ".light",
        400: ".regular",
        500: ".medium",
        600: ".semibold",
        700: ".bold",
        800: ".heavy",
        900: ".black",
      };

      const numericWeight = parseInt(fontWeight);
      // Fallback to .regular if weight is not 100-900 or non-numeric
      const swiftWeight = weightMap[numericWeight] || ".regular";

      // Output: Font.system(size: 32, weight: .bold)
      return `Font.system(size: ${getNumber(fontSize)}, weight: ${swiftWeight})`;
    },
  });

  // StyleDictionary.registerTransform({
  //   name: 'hdds/typography/css',
  //   type: 'value',
  //   filter: (token) => token.type === 'typography',
  //   transformer: (token) => {
  //     const { fontFamily, fontSize, fontWeight } = token.value;
  //     return `${fontWeight} ${getNumber(fontSize)}px "${fontFamily}"`;
  //   }
  // });

  // -------------------------------------------
  // ATOMIC TRANSFORMS
  // -------------------------------------------

  StyleDictionary.registerTransform({
    name: "hdds/name/android",
    type: "name",
    transform: (token, options) =>
      token.path.join("_").replace(/-/g, "_").toLowerCase(),
  });

  StyleDictionary.registerTransform({
    name: "hdds/name/pascal",
    type: "name",
    transform: (token, options) =>
      [options.prefix, ...token.path]
        .join(" ")
        .replace(/[^a-zA-Z0-9]/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(""),
  });

  StyleDictionary.registerTransform({
    name: "hdds/size/cgfloat",
    type: "value",
    transitive: true,
    filter: (token) => {
      const type = getTokenType(token);
      return dimensionTypes.includes(type);
    },
    transform: (token) => {
      const raw = getTokenValue(token);
      return `CGFloat(${getNumber(raw)})`;
    },
  });

  StyleDictionary.registerTransform({
    name: "hdds/android/xml/dp",
    type: "value",
    filter: (token) => {
      const type = getTokenType(token);
      return dimensionTypes.includes(type) && !isFontSizeToken(token);
    },
    transform: (token) => `${getNumber(getTokenValue(token))}dp`,
  });

  StyleDictionary.registerTransform({
    name: "hdds/android/xml/sp",
    type: "value",
    filter: (token) => isFontSizeToken(token),
    transform: (token) => `${getNumber(getTokenValue(token))}sp`,
  });

  StyleDictionary.registerTransform({
    name: "hdds/compose/dp",
    type: "value",
    filter: (token) => {
      const type = getTokenType(token);
      return dimensionTypes.includes(type) && !isFontSizeToken(token);
    },
    transform: (token) => `${getNumber(getTokenValue(token))}.dp`,
  });

  StyleDictionary.registerTransform({
    name: "hdds/compose/sp",
    type: "value",
    filter: (token) => isFontSizeToken(token),
    transform: (token) => `${getNumber(getTokenValue(token))}.sp`,
  });

  StyleDictionary.registerTransform({
    name: "hdds/color/swiftui",
    type: "value",
    filter: (token) => getTokenType(token).toLowerCase() === "color",
    transform: (token) => {
      const { red, green, blue, alpha } = parseColorValue(token);
      return `Color(red: ${formatSwiftComponent(red)}, green: ${formatSwiftComponent(green)}, blue: ${formatSwiftComponent(blue)}, opacity: ${formatSwiftComponent(alpha)})`;
    },
  });

  StyleDictionary.registerTransform({
    name: "hdds/color/compose",
    type: "value",
    filter: (token) => getTokenType(token).toLowerCase() === "color",
    transform: (token) => {
      const { red, green, blue, alpha } = parseColorValue(token);
      const argb = `${byteHex(alpha)}${byteHex(red)}${byteHex(green)}${byteHex(blue)}`;
      return `Color(0x${argb})`;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: "hdds/ios-swift",
    transforms: [
      "attribute/cti",
      "hdds/name/pascal",
      "hdds/color/swiftui",
      "hdds/size/cgfloat",
      "hdds/typography/swift",
    ],
  });

  StyleDictionary.registerTransformGroup({
    name: "hdds/android-compose",
    transforms: [
      "attribute/cti",
      "hdds/name/android",
      "hdds/color/compose",
      "hdds/compose/dp",
      "hdds/compose/sp",
      "hdds/typography/compose",
    ],
  });
}
