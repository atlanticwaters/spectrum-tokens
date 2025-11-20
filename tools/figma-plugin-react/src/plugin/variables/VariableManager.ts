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

export interface CreateVariableOptions {
  collectionId: string;
  name: string;
  type: VariableResolvedDataType;
  value: any;
  modeId?: string;
}

export interface VariableSyncResult {
  created: number;
  updated: number;
  errors: Array<{ name: string; error: string }>;
}

export class VariableManager {
  /**
   * Create a Figma variable from a token
   */
  async createVariableFromToken(options: CreateVariableOptions): Promise<string> {
    const { collectionId, name, type, value, modeId } = options;

    try {
      const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
      if (!collection) {
        throw new Error(`Collection not found: ${collectionId}`);
      }

      const variable = figma.variables.createVariable(name, collection, type);
      const targetModeId = modeId || collection.defaultModeId;

      // Set value based on type
      const convertedValue = this.convertValueForVariable(type, value);
      variable.setValueForMode(targetModeId, convertedValue);

      return variable.id;
    } catch (error) {
      throw new Error(
        `Failed to create variable "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing Figma variable
   */
  async updateVariable(variableId: string, modeId: string, value: any): Promise<void> {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) {
      throw new Error(`Variable not found: ${variableId}`);
    }

    const convertedValue = this.convertValueForVariable(variable.resolvedType, value);
    variable.setValueForMode(modeId, convertedValue);
  }

  /**
   * Pull all local variables from Figma
   */
  async pullVariables(): Promise<Record<string, any>> {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables: Record<string, any> = {};

    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (!variable) continue;

        const value = variable.valuesByMode[collection.defaultModeId];

        variables[variable.name] = {
          type: this.mapVariableTypeToTokenType(variable.resolvedType),
          value: this.convertVariableValueToToken(variable.resolvedType, value),
          variableId: variable.id,
          collectionId: collection.id,
        };
      }
    }

    return variables;
  }

  /**
   * Sync tokens to Figma variables (create or update)
   */
  async syncVariables(
    tokens: Record<string, any>,
    collectionId: string
  ): Promise<VariableSyncResult> {
    const result: VariableSyncResult = {
      created: 0,
      updated: 0,
      errors: [],
    };

    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) {
      throw new Error(`Collection not found: ${collectionId}`);
    }

    for (const [name, token] of Object.entries(tokens)) {
      try {
        const existingVariable = await this.findVariableByName(name, collectionId);

        if (existingVariable) {
          await this.updateVariable(
            existingVariable.id,
            collection.defaultModeId,
            token.value
          );
          result.updated++;
        } else {
          const variableType = this.mapTokenTypeToVariableType(token.type);
          await this.createVariableFromToken({
            collectionId,
            name,
            type: variableType,
            value: token.value,
          });
          result.created++;
        }
      } catch (error) {
        result.errors.push({
          name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Convert a value to the appropriate format for a Figma variable
   */
  private convertValueForVariable(type: VariableResolvedDataType, value: any): any {
    switch (type) {
      case 'COLOR':
        if (typeof value === 'string') {
          return this.parseColor(value);
        }
        return value;

      case 'FLOAT':
        return typeof value === 'number' ? value : parseFloat(value);

      case 'STRING':
        return String(value);

      case 'BOOLEAN':
        return Boolean(value);

      default:
        return value;
    }
  }

  /**
   * Convert a Figma variable value to token format
   */
  private convertVariableValueToToken(type: VariableResolvedDataType, value: any): any {
    switch (type) {
      case 'COLOR':
        if (typeof value === 'object' && 'r' in value) {
          return this.rgbToHex(value);
        }
        return value;

      case 'FLOAT':
      case 'STRING':
      case 'BOOLEAN':
        return value;

      default:
        return value;
    }
  }

  /**
   * Parse color string to RGB object
   */
  private parseColor(value: string): RGB {
    // Handle hex colors
    if (value.startsWith('#')) {
      const hex = value.slice(1);
      return {
        r: parseInt(hex.slice(0, 2), 16) / 255,
        g: parseInt(hex.slice(2, 4), 16) / 255,
        b: parseInt(hex.slice(4, 6), 16) / 255,
      };
    }

    // Handle rgb/rgba
    if (value.startsWith('rgb')) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        return {
          r: parseInt(match[1]) / 255,
          g: parseInt(match[2]) / 255,
          b: parseInt(match[3]) / 255,
        };
      }
    }

    // Default to black
    return { r: 0, g: 0, b: 0 };
  }

  /**
   * Convert RGB object to hex string
   */
  private rgbToHex(color: RGB): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * Find a variable by name in a collection
   */
  private async findVariableByName(
    name: string,
    collectionId: string
  ): Promise<Variable | null> {
    const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
    if (!collection) return null;

    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (variable && variable.name === name) {
        return variable;
      }
    }

    return null;
  }

  /**
   * Map token type to Figma variable type
   */
  private mapTokenTypeToVariableType(tokenType: string): VariableResolvedDataType {
    switch (tokenType) {
      case 'color':
        return 'COLOR';
      case 'dimension':
      case 'spacing':
      case 'opacity':
      case 'number':
        return 'FLOAT';
      case 'string':
      case 'fontFamily':
        return 'STRING';
      case 'boolean':
        return 'BOOLEAN';
      default:
        return 'FLOAT';
    }
  }

  /**
   * Map Figma variable type to token type
   */
  private mapVariableTypeToTokenType(variableType: VariableResolvedDataType): string {
    switch (variableType) {
      case 'COLOR':
        return 'color';
      case 'FLOAT':
        return 'dimension';
      case 'STRING':
        return 'string';
      case 'BOOLEAN':
        return 'boolean';
      default:
        return 'unknown';
    }
  }
}
