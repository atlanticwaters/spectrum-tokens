/**
 * Copyright 2024 Adobe. All rights reserved.
 */

import test from "ava";
import { detectTokenType } from "../src/mapping/typeDetector";
import type { FigmaVariable } from "../shared/types";

// Test COLOR detection
test("detects COLOR as color token", (t) => {
  const variable: FigmaVariable = {
    id: "1",
    name: "primary-blue",
    resolvedType: "COLOR",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, { r: 0, g: 0, b: 1, a: 1 });

  t.is(result.type, "color");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "color");
});

// Test FLOAT → opacity
test("detects FLOAT with opacity keyword as opacity", (t) => {
  const variable: FigmaVariable = {
    id: "2",
    name: "button-opacity",
    resolvedType: "FLOAT",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 0.5);

  t.is(result.type, "number");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "opacity");
});

// Test FLOAT → dimension
test("detects FLOAT with size keyword as dimension", (t) => {
  const variable: FigmaVariable = {
    id: "3",
    name: "button-size",
    resolvedType: "FLOAT",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 16);

  t.is(result.type, "dimension");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "dimension");
});

// Test FLOAT → font weight
test("detects FLOAT with weight keyword as fontWeight", (t) => {
  const variable: FigmaVariable = {
    id: "4",
    name: "heading-font-weight",
    resolvedType: "FLOAT",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 700);

  t.is(result.type, "fontWeight");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "font-weight");
});

// Test STRING → fontFamily
test("detects STRING with font keyword as fontFamily", (t) => {
  const variable: FigmaVariable = {
    id: "5",
    name: "body-font-family",
    resolvedType: "STRING",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, "Inter");

  t.is(result.type, "fontFamily");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "font-family");
});

// Test alias detection
test("detects alias variables", (t) => {
  const variable: FigmaVariable = {
    id: "6",
    name: "button-bg",
    resolvedType: "COLOR",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, {
    type: "VARIABLE_ALIAS",
    id: "VariableID:123",
  });

  t.is(result.type, "string");
  t.is(result.confidence, "high");
  t.is(result.spectrumSchema, "alias");
});

// Test common pixel values
test("detects common pixel values as dimensions", (t) => {
  const variable: FigmaVariable = {
    id: "7",
    name: "spacing",
    resolvedType: "FLOAT",
    valuesByMode: {},
    description: "",
    hiddenFromPublishing: false,
    scopes: ["ALL_SCOPES"],
    codeSyntax: {},
  };

  const result = detectTokenType(variable, 16);

  t.is(result.type, "dimension");
  t.is(result.spectrumSchema, "dimension");
});
