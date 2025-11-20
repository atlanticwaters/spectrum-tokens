/**
 * Copyright 2024 Adobe. All rights reserved.
 */

import test from "ava";
import { detectTokenType } from "../src/mapping/typeDetector";
import type { FigmaVariable } from "../src/shared/types";

/**
 * Test border radius detection with CORNER_RADIUS scope
 */
test("typeDetector › detects CORNER_RADIUS scope as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-1",
    name: "button/border",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 8 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["CORNER_RADIUS"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 8);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Figma CORNER_RADIUS scope detected");
});

/**
 * Test border radius detection with 'radius' keyword
 */
test("typeDetector › detects 'radius' keyword as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-2",
    name: "corner-radius-100",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 4 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 4);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Border radius keywords detected");
});

/**
 * Test border radius detection with 'border-radius' keyword
 */
test("typeDetector › detects 'border-radius' keyword as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-3",
    name: "button/border-radius",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 6 },
    description: "Border radius for buttons",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 6);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Border radius keywords detected");
});

/**
 * Test border radius detection with 'corner' keyword
 */
test("typeDetector › detects 'corner' keyword as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-4",
    name: "rounded-corner",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 12 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 12);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Border radius keywords detected");
});

/**
 * Test border radius detection with 'rounded' keyword
 */
test("typeDetector › detects 'rounded' keyword as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-5",
    name: "button-rounded",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 8 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 8);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Border radius keywords detected");
});

/**
 * Test that regular dimensions are NOT detected as borderRadius
 */
test("typeDetector › does not detect padding as borderRadius", (t) => {
  const variable: FigmaVariable = {
    id: "test-6",
    name: "button/padding",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 8 },
    description: "Button padding",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 8);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "dimension");
  t.not(result.spectrumSchema, "borderRadius");
});

/**
 * Test that CORNER_RADIUS scope takes precedence over name
 */
test("typeDetector › CORNER_RADIUS scope takes precedence", (t) => {
  const variable: FigmaVariable = {
    id: "test-7",
    name: "button/padding", // Name suggests padding, not radius
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 8 },
    description: "",
    hiddenFromPublishing: false,
    scopes: ["CORNER_RADIUS"], // But scope says it's a radius
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 8);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.reason, "Figma CORNER_RADIUS scope detected");
});

/**
 * Test radius keyword in description
 */
test("typeDetector › detects radius keyword in description", (t) => {
  const variable: FigmaVariable = {
    id: "test-8",
    name: "button/size",
    resolvedType: "FLOAT",
    valuesByMode: { mode1: 4 },
    description: "Corner radius for small buttons",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 4);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "borderRadius");
  t.is(result.confidence, "high");
  t.is(result.reason, "Border radius keywords detected");
});
