/**
 * Shared TypeScript types for Figma Token Exporter Plugin
 * These types are used by both the plugin code and UI code
 */

// ============================================================================
// Figma API Types (simplified from @figma/plugin-typings)
// ============================================================================

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: "BOOLEAN" | "COLOR" | "FLOAT" | "STRING";
  valuesByMode: Record<string, VariableValue>;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: VariableScope[];
  codeSyntax: Record<string, string>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
}

export type VariableValue =
  | boolean
  | number
  | string
  | RGB
  | RGBA
  | VariableAlias;

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export type VariableScope =
  | "ALL_SCOPES"
  | "TEXT_CONTENT"
  | "CORNER_RADIUS"
  | "WIDTH_HEIGHT"
  | "GAP"
  | "STROKE_COLOR"
  | "FILL_COLOR"
  | "EFFECT_COLOR";

// ============================================================================
// Design Tokens Format (DTCG Spec)
// ============================================================================

export interface DesignToken {
  $value: TokenValue;
  $type?: TokenType;
  $description?: string;
  $extensions?: {
    "com.figma"?: FigmaExtensions;
    [key: string]: unknown;
  };
  $deprecated?: boolean | string;
}

export interface TokenGroup {
  $type?: TokenType;
  $description?: string;
  $extensions?: Record<string, unknown>;
  [key: string]: DesignToken | TokenGroup | unknown;
}

export type TokenValue =
  | string
  | number
  | boolean
  | ColorValue
  | DimensionValue
  | Record<string, unknown>
  | unknown[];

export interface ColorValue {
  colorSpace: "srgb" | "p3" | "hsl";
  components: [number, number, number];
  alpha?: number;
  hex?: string;
}

export interface DimensionValue {
  value: number;
  unit: "px" | "rem" | "em" | "%";
}

export type TokenType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "string"
  | "boolean";

export interface FigmaExtensions {
  variableId: string;
  collectionId: string;
  collectionName: string;
  mode?: string;
  scopes: VariableScope[];
  originalType: string;
  figmaValue?: VariableValue;
  exportDate: string;
  exportVersion: string;
}

// ============================================================================
// Adobe Spectrum Token Format
// ============================================================================

export interface SpectrumToken {
  $schema: string;
  value: string | number | SpectrumColorSetValue | SpectrumScaleSetValue;
  uuid: string;
  component?: string;
  private?: boolean;
  deprecated?: boolean;
  deprecated_comment?: string;
  sets?: SpectrumColorSetValue | SpectrumScaleSetValue;
}

export interface SpectrumColorSetValue {
  light?: SpectrumTokenValue;
  dark?: SpectrumTokenValue;
  wireframe?: SpectrumTokenValue;
}

export interface SpectrumScaleSetValue {
  mobile?: SpectrumTokenValue;
  desktop?: SpectrumTokenValue;
}

export interface SpectrumTokenValue {
  $schema: string;
  value: string | number;
  uuid: string;
}

// ============================================================================
// Plugin Configuration
// ============================================================================

export interface ExportSettings {
  format: "dtcg" | "spectrum" | "both";
  structure: "nested" | "flat";
  fileOrganization: "single" | "byCollection" | "byComponent";
  includePrivate: boolean;
  includeDeprecated: boolean;
  namingConvention: "kebab-case" | "camelCase" | "snake_case";
  defaultUnit: "px" | "rem";
  modeHandling: "color-set" | "scale-set" | "groups" | "auto";
  includeMetadata: boolean;
  generateUUIDs: "deterministic" | "random";
}

export interface CollectionSelection {
  collectionId: string;
  collectionName: string;
  modes: string[];
  selectedModes: string[];
  variableCount: number;
  selected: boolean;
}

// ============================================================================
// Plugin Messages (UI <-> Plugin Code communication)
// ============================================================================

export type PluginMessage =
  | ScanCollectionsMessage
  | ExportTokensMessage
  | CancelExportMessage
  | ClosePluginMessage;

export type PluginResponse =
  | CollectionsScannedResponse
  | ExportProgressResponse
  | ExportCompleteResponse
  | ExportErrorResponse;

export interface ScanCollectionsMessage {
  type: "scan-collections";
}

export interface ExportTokensMessage {
  type: "export-tokens";
  payload: {
    selections: CollectionSelection[];
    settings: ExportSettings;
  };
}

export interface CancelExportMessage {
  type: "cancel-export";
}

export interface ClosePluginMessage {
  type: "close-plugin";
}

export interface CollectionsScannedResponse {
  type: "collections-scanned";
  payload: {
    collections: CollectionSelection[];
  };
}

export interface ExportProgressResponse {
  type: "export-progress";
  payload: {
    current: number;
    total: number;
    message: string;
  };
}

export interface ExportCompleteResponse {
  type: "export-complete";
  payload: {
    success: true;
    exportPath: string;
    tokenCount: number;
    warnings: ValidationWarning[];
  };
}

export interface ExportErrorResponse {
  type: "export-error";
  payload: {
    success: false;
    error: string;
    details?: ValidationError[];
  };
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  level: "error";
  code: string;
  message: string;
  tokens?: string[];
  suggestion?: string;
}

export interface ValidationWarning {
  level: "warning";
  code: string;
  message: string;
  token?: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    exported: number;
    errors: number;
    warnings: number;
    skipped: number;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isRGB(value: unknown): value is RGB {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    "g" in value &&
    "b" in value &&
    typeof value.r === "number" &&
    typeof value.g === "number" &&
    typeof value.b === "number"
  );
}

export function isRGBA(value: unknown): value is RGBA {
  return isRGB(value) && "a" in value && typeof value.a === "number";
}

export function isVariableAlias(value: unknown): value is VariableAlias {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS" &&
    "id" in value &&
    typeof value.id === "string"
  );
}

// ============================================================================
// Constants
// ============================================================================

export const PLUGIN_VERSION = "1.0.0";

export const SCHEMA_BASE_URL =
  "https://opensource.adobe.com/spectrum-tokens/schemas/token-types";

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
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

export const SUPPORTED_TOKEN_TYPES: TokenType[] = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "string",
  "boolean",
];

export const SPECTRUM_SCHEMAS = {
  color: `${SCHEMA_BASE_URL}/color.json`,
  dimension: `${SCHEMA_BASE_URL}/dimension.json`,
  opacity: `${SCHEMA_BASE_URL}/opacity.json`,
  fontFamily: `${SCHEMA_BASE_URL}/font-family.json`,
  fontWeight: `${SCHEMA_BASE_URL}/font-weight.json`,
  fontSize: `${SCHEMA_BASE_URL}/font-size.json`,
  alias: `${SCHEMA_BASE_URL}/alias.json`,
  multiplier: `${SCHEMA_BASE_URL}/multiplier.json`,
  colorSet: `${SCHEMA_BASE_URL}/color-set.json`,
  scaleSet: `${SCHEMA_BASE_URL}/scale-set.json`,
  typography: `${SCHEMA_BASE_URL}/typography.json`,
} as const;
