/**
 * Copyright 2024 Adobe. All rights reserved.
 */

import test from "ava";
import { TokenConverter, convertTokens } from "../src/mapping/tokenConverter";
import type {
  FigmaVariable,
  FigmaVariableCollection,
  ExportSettings,
} from "../src/shared/types";

const defaultSettings: ExportSettings = {
  format: "both",
  structure: "nested",
  fileOrganization: "single",
  includePrivate: false,
  includeDeprecated: false,
  namingConvention: "kebab-case",
  defaultUnit: "px",
  modeHandling: "auto",
  includeMetadata: true,
  generateUUIDs: "deterministic",
};

// Test: Convert simple color variable
test("converts COLOR variable to DTCG and Spectrum formats", (t) => {
  const variable: FigmaVariable = {
    id: "var1",
    name: "primary-blue",
    resolvedType: "COLOR",
    valuesByMode: {
      mode1: { r: 0, g: 0.4, b: 0.8, a: 1 },
    },
    description: "Primary brand color",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [variable],
  });

  // Check DTCG format
  t.truthy(result.dtcgTokens["primary-blue"]);
  const dtcgToken = result.dtcgTokens["primary-blue"] as any;
  t.is(dtcgToken.$type, "color");
  t.is(dtcgToken.$description, "Primary brand color");
  t.truthy(dtcgToken.$value);
  t.is(dtcgToken.$value.hex, "#0066CC");

  // Check Spectrum format
  t.truthy(result.spectrumTokens["primary-blue"]);
  const spectrumToken = result.spectrumTokens["primary-blue"];
  t.truthy(spectrumToken.$schema);
  t.is(spectrumToken.value, "rgb(0, 102, 204)");
  t.truthy(spectrumToken.uuid);
});

// Test: Convert dimension variable
test("converts FLOAT dimension variable", (t) => {
  const variable: FigmaVariable = {
    id: "var2",
    name: "spacing-medium",
    resolvedType: "FLOAT",
    valuesByMode: {
      mode1: 16,
    },
    description: "Medium spacing",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [variable],
  });

  // Check DTCG format
  const dtcgToken = result.dtcgTokens["spacing-medium"] as any;
  t.is(dtcgToken.$type, "dimension");
  t.is(dtcgToken.$value.value, 16);
  t.is(dtcgToken.$value.unit, "px");

  // Check Spectrum format
  const spectrumToken = result.spectrumTokens["spacing-medium"];
  t.is(spectrumToken.value, "16px");
});

// Test: Convert opacity variable
test("converts FLOAT opacity variable", (t) => {
  const variable: FigmaVariable = {
    id: "var3",
    name: "disabled-opacity",
    resolvedType: "FLOAT",
    valuesByMode: {
      mode1: 0.5,
    },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [variable],
  });

  // Check types
  const dtcgToken = result.dtcgTokens["disabled-opacity"] as any;
  t.is(dtcgToken.$type, "number");
  t.is(dtcgToken.$value, 0.5);

  const spectrumToken = result.spectrumTokens["disabled-opacity"];
  t.is(spectrumToken.value, "0.5");
  t.truthy(spectrumToken.$schema.includes("opacity"));
});

// Test: Convert font family variable
test("converts STRING font family variable", (t) => {
  const variable: FigmaVariable = {
    id: "var4",
    name: "body-font-family",
    resolvedType: "STRING",
    valuesByMode: {
      mode1: "Inter",
    },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [variable],
  });

  const dtcgToken = result.dtcgTokens["body-font-family"] as any;
  t.is(dtcgToken.$type, "fontFamily");
  t.is(dtcgToken.$value, "Inter");

  const spectrumToken = result.spectrumTokens["body-font-family"];
  t.is(spectrumToken.value, "Inter");
  t.truthy(spectrumToken.$schema.includes("font-family"));
});

// Test: Handle alias variables
test("converts alias variables with reference syntax", (t) => {
  const primaryColor: FigmaVariable = {
    id: "var-primary",
    name: "colors/primary",
    resolvedType: "COLOR",
    valuesByMode: {
      mode1: { r: 0, g: 0.4, b: 0.8, a: 1 },
    },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const buttonBg: FigmaVariable = {
    id: "var-button",
    name: "button/background",
    resolvedType: "COLOR",
    valuesByMode: {
      mode1: { type: "VARIABLE_ALIAS", id: "var-primary" },
    },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [primaryColor, buttonBg],
  });

  // Check DTCG format uses {token.name} syntax
  const dtcgToken = result.dtcgTokens["button.background"] as any;
  t.is(dtcgToken.$value, "{colors.primary}");

  // Check Spectrum format uses flattened reference
  const spectrumToken = result.spectrumTokens["button.background"];
  t.is(spectrumToken.value, "{colors-primary}");
});

// Test: Skip private variables when setting is false
test("skips private variables when includePrivate is false", (t) => {
  const privateVar: FigmaVariable = {
    id: "var-private",
    name: "internal-value",
    resolvedType: "FLOAT",
    valuesByMode: {
      mode1: 42,
    },
    description: "",
    hiddenFromPublishing: true,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: { ...defaultSettings, includePrivate: false },
    collections: [],
    variables: [privateVar],
  });

  t.is(Object.keys(result.dtcgTokens).length, 0);
  t.is(Object.keys(result.spectrumTokens).length, 0);
});

// Test: Include private variables when setting is true
test("includes private variables when includePrivate is true", (t) => {
  const privateVar: FigmaVariable = {
    id: "var-private",
    name: "internal-value",
    resolvedType: "FLOAT",
    valuesByMode: {
      mode1: 42,
    },
    description: "",
    hiddenFromPublishing: true,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: { ...defaultSettings, includePrivate: true },
    collections: [],
    variables: [privateVar],
  });

  t.is(Object.keys(result.dtcgTokens).length, 1);
  t.is(Object.keys(result.spectrumTokens).length, 1);

  // Check that private flag is set in Spectrum
  t.is(result.spectrumTokens["internal-value"]?.private, true);
});

// Test: Extract component name from variable path
test("extracts component name from variable path", (t) => {
  const variable: FigmaVariable = {
    id: "var5",
    name: "button/background/default",
    resolvedType: "COLOR",
    valuesByMode: {
      mode1: { r: 1, g: 1, b: 1, a: 1 },
    },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: defaultSettings,
    collections: [],
    variables: [variable],
  });

  const spectrumToken = result.spectrumTokens["button.background.default"];
  t.is(spectrumToken?.component, "button");
});

// Test: Naming conventions
test("applies kebab-case naming convention", (t) => {
  const variable: FigmaVariable = {
    id: "var6",
    name: "My Token Name",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 10 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = convertTokens({
    settings: { ...defaultSettings, namingConvention: "kebab-case" },
    collections: [],
    variables: [variable],
  });

  t.truthy(result.dtcgTokens["my-token-name"]);
});

// Test: Conversion statistics
test("provides conversion statistics", (t) => {
  const variables: FigmaVariable[] = [
    {
      id: "v1",
      name: "token1",
      resolvedType: "COLOR",
      valuesByMode: { mode1: { r: 0, g: 0, b: 0, a: 1 } },
      description: "",
      hiddenFromPublishing: false,
      scopes: ["ALL_SCOPES"],
      codeSyntax: {},
    },
    {
      id: "v2",
      name: "token2",
      resolvedType: "FLOAT",
      valuesByMode: { mode1: 16 },
      description: "",
      hiddenFromPublishing: false,
      scopes: ["ALL_SCOPES"],
      codeSyntax: {},
    },
  ];

  const converter = new TokenConverter({
    settings: defaultSettings,
    collections: [],
    variables,
  });

  converter.convert();
  const stats = converter.getStats();

  t.is(stats.totalVariables, 2);
  t.is(stats.collections, 0);
});
