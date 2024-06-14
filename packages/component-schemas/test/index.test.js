import { schemaFileNames, getSchemaFile, getAllSchemas } from "../index.js";
import test from "ava";

test("the number of schema returned by getAllSchemas should match the number of schema returned by schemaFileNames", async (t) => {
  const allSchema = await getAllSchemas();
  t.is(schemaFileNames.length, allSchema.length);
});
test("getSchemaFile should fetch schema data", async (t) => {
  t.snapshot(await getSchemaFile(schemaFileNames[0]));
});
