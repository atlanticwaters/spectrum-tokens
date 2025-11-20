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

/**
 * Token Converter Orchestrator
 * Coordinates all conversion components to transform Figma variables into Design Tokens
 */

import type {
  FigmaVariable,
  FigmaVariableCollection,
  DesignToken,
  SpectrumToken,
  ExportSettings,
  VariableValue,
  PLUGIN_VERSION,
} from "../shared/types";
import { isVariableAlias } from "../shared/types";
import { detectTokenType } from "./typeDetector";
import { transformValue } from "./valueTransformer";
import { getSpectrumSchema } from "./schemaMapper";
import { generateTokenUUID } from "../utils/uuid";
import {
  validateExportSettings,
  validateFigmaVariable,
  validateVariableValue,
  validateDTCGToken,
  validateSpectrumToken,
} from "../utils/validators";

export interface ConversionResult {
  dtcgTokens: Record<string, DesignToken | Record<string, unknown>>;
  spectrumTokens: Record<string, SpectrumToken>;
  variableMap: Map<string, string>;
  warnings: string[];
  errors: string[];
}

export interface ConversionOptions {
  settings: ExportSettings;
  collections: FigmaVariableCollection[];
  variables: FigmaVariable[];
}

/**
 * Main token converter class
 */
export class TokenConverter {
  private variableMap: Map<string, string> = new Map();
  private variableById: Map<string, FigmaVariable> = new Map();
  private warnings: string[] = [];
  private errors: string[] = [];

  constructor(private options: ConversionOptions) {
    this.buildVariableMap();
  }

  /**
   * Build map of variable IDs to names for alias resolution
   */
  private buildVariableMap(): void {
    for (const variable of this.options.variables) {
      this.variableMap.set(variable.id, variable.name);
      this.variableById.set(variable.id, variable);
    }
  }

  /**
   * Convert all variables to tokens
   */
  public convert(): ConversionResult {
    const dtcgTokens: Record<string, DesignToken | Record<string, unknown>> =
      {};
    const spectrumTokens: Record<string, SpectrumToken> = {};

    // Validate export settings
    const settingsValidation = validateExportSettings(this.options.settings);
    if (!settingsValidation.valid) {
      for (const error of settingsValidation.errors) {
        this.errors.push(`Settings validation failed: ${error.message}`);
      }
    }
    for (const warning of settingsValidation.warnings) {
      this.warnings.push(`Settings warning: ${warning.message}`);
    }

    for (const variable of this.options.variables) {
      try {
        // Validate variable structure
        const variableValidation = validateFigmaVariable(variable);
        if (!variableValidation.valid) {
          for (const error of variableValidation.errors) {
            this.errors.push(error.message);
          }
          continue; // Skip this variable if it has errors
        }
        for (const warning of variableValidation.warnings) {
          this.warnings.push(warning.message);
        }

        // Skip private variables if setting says so
        if (
          variable.hiddenFromPublishing &&
          !this.options.settings.includePrivate
        ) {
          continue;
        }

        // Get the primary value (first mode or default mode)
        const value = this.getPrimaryValue(variable);

        if (value === undefined) {
          this.warnings.push(
            `Variable "${variable.name}" has no value in default mode`,
          );
          continue;
        }

        // Validate variable value
        const modeId = Object.keys(variable.valuesByMode)[0] || "";
        const valueValidation = validateVariableValue(variable, modeId, value);
        if (!valueValidation.valid) {
          for (const error of valueValidation.errors) {
            this.errors.push(error.message);
          }
          continue; // Skip this variable if value is invalid
        }
        for (const warning of valueValidation.warnings) {
          this.warnings.push(warning.message);
        }

        // Detect token type
        const detection = detectTokenType(variable, value);

        // Generate tokens
        const tokenName = this.sanitizeTokenName(variable.name);

        // Create DTCG token
        if (
          this.options.settings.format === "dtcg" ||
          this.options.settings.format === "both"
        ) {
          const dtcgToken = this.createDTCGToken(
            variable,
            value,
            detection.type,
          );

          // Validate generated DTCG token
          const dtcgValidation = validateDTCGToken(tokenName, dtcgToken);
          for (const warning of dtcgValidation.warnings) {
            this.warnings.push(warning.message);
          }

          dtcgTokens[tokenName] = dtcgToken;
        }

        // Create Spectrum token
        if (
          this.options.settings.format === "spectrum" ||
          this.options.settings.format === "both"
        ) {
          const spectrumToken = this.createSpectrumToken(
            variable,
            value,
            detection.type,
            detection.spectrumSchema,
          );

          // Validate generated Spectrum token
          const spectrumValidation = validateSpectrumToken(
            tokenName,
            spectrumToken,
          );
          for (const warning of spectrumValidation.warnings) {
            this.warnings.push(warning.message);
          }

          spectrumTokens[tokenName] = spectrumToken;
        }
      } catch (error) {
        const errorMsg = `Failed to convert variable "${variable.name}": ${error instanceof Error ? error.message : "Unknown error"}`;
        this.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return {
      dtcgTokens,
      spectrumTokens,
      variableMap: this.variableMap,
      warnings: this.warnings,
      errors: this.errors,
    };
  }

  /**
   * Get the primary value for a variable (from default mode)
   */
  private getPrimaryValue(variable: FigmaVariable): VariableValue | undefined {
    const modes = Object.keys(variable.valuesByMode);
    if (modes.length === 0) return undefined;

    // Use first mode as primary
    const primaryMode = modes[0];
    return variable.valuesByMode[primaryMode!];
  }

  /**
   * Create Design Tokens (DTCG) format token
   */
  private createDTCGToken(
    variable: FigmaVariable,
    value: VariableValue,
    tokenType: string,
  ): DesignToken {
    const transformedValue = transformValue(value, tokenType, {
      defaultUnit: this.options.settings.defaultUnit,
      variableMap: this.variableMap,
      format: "dtcg",
    });

    const token: DesignToken = {
      $value: transformedValue,
      $type: tokenType as DesignToken["$type"],
    };

    // Add description if available
    if (variable.description) {
      token.$description = variable.description;
    }

    // Add Figma metadata in extensions
    if (this.options.settings.includeMetadata) {
      token.$extensions = {
        "com.figma": {
          variableId: variable.id,
          collectionId: "", // Will be filled by collection processor
          collectionName: "", // Will be filled by collection processor
          scopes: variable.scopes,
          originalType: variable.resolvedType,
          exportDate: new Date().toISOString(),
          exportVersion: "1.0.0",
        },
      };
    }

    return token;
  }

  /**
   * Create Spectrum format token
   */
  private createSpectrumToken(
    variable: FigmaVariable,
    value: VariableValue,
    tokenType: string,
    spectrumSchema?: string,
  ): SpectrumToken {
    const transformedValue = transformValue(value, tokenType, {
      defaultUnit: this.options.settings.defaultUnit,
      variableMap: this.variableMap,
      format: "spectrum",
    });

    const schema = getSpectrumSchema(tokenType, spectrumSchema);
    const uuid = this.generateUUID(variable);

    // Determine component name from variable path
    const component = this.extractComponentName(variable.name);

    const token: SpectrumToken = {
      $schema: schema,
      value: transformedValue as string | number,
      uuid,
    };

    // Add optional properties
    if (component) {
      token.component = component;
    }

    if (variable.hiddenFromPublishing) {
      token.private = true;
    }

    return token;
  }

  /**
   * Generate UUID for variable
   */
  private generateUUID(variable: FigmaVariable): string {
    return generateTokenUUID(variable.id);
  }

  /**
   * Sanitize token name for DTCG format
   * Converts "colors/primary/blue" to "colors.primary.blue" for nested structure
   * or "colors-primary-blue" for flat structure
   */
  private sanitizeTokenName(name: string): string {
    const separator = this.options.settings.structure === "nested" ? "." : "-";

    // Remove invalid characters and convert separators
    let sanitized = name
      .replace(/[{}]/g, "") // Remove braces
      .replace(/\$/g, "") // Remove dollar signs
      .replace(/\//g, separator); // Convert slashes to separator

    // Apply naming convention
    switch (this.options.settings.namingConvention) {
      case "kebab-case":
        sanitized = sanitized.toLowerCase().replace(/\s+/g, "-");
        break;
      case "camelCase":
        sanitized = sanitized.replace(/[-_\s]+(.)/g, (_, char) =>
          char.toUpperCase(),
        );
        break;
      case "snake_case":
        sanitized = sanitized.toLowerCase().replace(/[-\s]+/g, "_");
        break;
    }

    return sanitized;
  }

  /**
   * Extract component name from variable path
   * "button/background/default" → "button"
   */
  private extractComponentName(name: string): string | undefined {
    const parts = name.split("/");
    if (parts.length > 1 && parts[0]) {
      return parts[0].toLowerCase();
    }
    return undefined;
  }

  /**
   * Resolve alias chain to get final value
   * Handles chains like: A → B → C → actual value
   */
  public resolveAlias(
    variableId: string,
    visited = new Set<string>(),
  ): {
    value: VariableValue;
    variable: FigmaVariable;
  } | null {
    // Check for circular reference
    if (visited.has(variableId)) {
      this.errors.push(`Circular alias reference detected for ${variableId}`);
      return null;
    }

    visited.add(variableId);

    const variable = this.variableById.get(variableId);
    if (!variable) {
      this.errors.push(`Alias target not found: ${variableId}`);
      return null;
    }

    const value = this.getPrimaryValue(variable);
    if (value === undefined) {
      return null;
    }

    // If this value is also an alias, resolve recursively
    if (isVariableAlias(value)) {
      return this.resolveAlias(value.id, visited);
    }

    return { value, variable };
  }

  /**
   * Get conversion statistics
   */
  public getStats() {
    return {
      totalVariables: this.options.variables.length,
      warnings: this.warnings.length,
      errors: this.errors.length,
      collections: this.options.collections.length,
    };
  }
}

/**
 * Convenience function to convert variables
 */
export function convertTokens(options: ConversionOptions): ConversionResult {
  const converter = new TokenConverter(options);
  return converter.convert();
}
