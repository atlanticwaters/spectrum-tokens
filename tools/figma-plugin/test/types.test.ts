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

import test from "ava";
import { isRGB, isRGBA, isVariableAlias } from "../src/shared/types";

test("isRGB type guard works correctly", (t) => {
  // Valid RGB
  t.true(isRGB({ r: 0, g: 0.5, b: 1 }));

  // Invalid RGB
  t.false(isRGB({ r: 0, g: 0.5 })); // Missing b
  t.false(isRGB({ r: "red", g: 0, b: 0 })); // Wrong type
  t.false(isRGB(null));
  t.false(isRGB(undefined));
  t.false(isRGB(123));
  t.false(isRGB("rgb(0,0,0)"));
});

test("isRGBA type guard works correctly", (t) => {
  // Valid RGBA
  t.true(isRGBA({ r: 0, g: 0.5, b: 1, a: 0.8 }));

  // Invalid RGBA
  t.false(isRGBA({ r: 0, g: 0.5, b: 1 })); // Missing a
  t.false(isRGBA({ r: 0, g: 0.5, b: 1, a: "half" })); // Wrong type
  t.false(isRGBA(null));
  t.false(isRGBA(undefined));
});

test("isVariableAlias type guard works correctly", (t) => {
  // Valid alias
  t.true(
    isVariableAlias({
      type: "VARIABLE_ALIAS",
      id: "VariableID:123:456",
    }),
  );

  // Invalid alias
  t.false(isVariableAlias({ type: "COLOR", id: "123" }));
  t.false(isVariableAlias({ type: "VARIABLE_ALIAS" })); // Missing id
  t.false(isVariableAlias({ id: "123" })); // Missing type
  t.false(isVariableAlias(null));
  t.false(isVariableAlias(undefined));
});
