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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { VariableManager } from './VariableManager';

// Mock Figma variable API
const mockVariable = {
  id: 'var-1',
  name: 'Primary Color',
  resolvedType: 'COLOR' as VariableResolvedDataType,
  valuesByMode: {} as Record<string, any>,
  setValueForMode: jest.fn((modeId: string, value: any) => {
    mockVariable.valuesByMode[modeId] = value;
  }),
};

const mockCollection = {
  id: 'collection-1',
  name: 'Design Tokens',
  defaultModeId: 'mode-1',
  modes: [{ modeId: 'mode-1', name: 'Default' }],
  variableIds: ['var-1'],
};

(global as any).figma = {
  variables: {
    createVariable: jest.fn((name: string, collection: any, type: VariableResolvedDataType) => {
      const newVar = {
        ...mockVariable,
        id: `var-${Date.now()}`,
        name,
        resolvedType: type,
        valuesByMode: {},
      };
      return newVar;
    }),
    getVariableByIdAsync: jest.fn(async (id: string) => {
      if (id === 'var-1') return mockVariable;
      return null;
    }),
    getVariableCollectionByIdAsync: jest.fn(async (id: string) => {
      if (id === 'collection-1') return mockCollection;
      return null;
    }),
    getLocalVariableCollectionsAsync: jest.fn(async () => [mockCollection]),
  },
} as any;

describe('VariableManager', () => {
  let manager: VariableManager;

  beforeEach(() => {
    manager = new VariableManager();
    jest.clearAllMocks();
    mockVariable.valuesByMode = {};
  });

  describe('createVariableFromToken', () => {
    it('creates COLOR variable from hex color', async () => {
      const variableId = await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Primary',
        type: 'COLOR',
        value: '#ff0000',
      });

      expect(figma.variables.createVariable).toHaveBeenCalledWith(
        'Primary',
        mockCollection,
        'COLOR'
      );
      expect(variableId).toBeTruthy();
    });

    it('creates FLOAT variable from number', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Spacing',
        type: 'FLOAT',
        value: 16,
      });

      expect(figma.variables.createVariable).toHaveBeenCalledWith(
        'Spacing',
        mockCollection,
        'FLOAT'
      );
    });

    it('creates STRING variable', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'FontFamily',
        type: 'STRING',
        value: 'Inter',
      });

      expect(figma.variables.createVariable).toHaveBeenCalledWith(
        'FontFamily',
        mockCollection,
        'STRING'
      );
    });

    it('creates BOOLEAN variable', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'IsEnabled',
        type: 'BOOLEAN',
        value: true,
      });

      expect(figma.variables.createVariable).toHaveBeenCalledWith(
        'IsEnabled',
        mockCollection,
        'BOOLEAN'
      );
    });

    it('uses default mode when modeId not specified', async () => {
      const variable = await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'FLOAT',
        value: 10,
      });

      // Variable should have value set for default mode
      expect(figma.variables.createVariable).toHaveBeenCalled();
    });

    it('uses specified modeId when provided', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'FLOAT',
        value: 10,
        modeId: 'custom-mode',
      });

      expect(figma.variables.createVariable).toHaveBeenCalled();
    });

    it('throws error when collection not found', async () => {
      await expect(
        manager.createVariableFromToken({
          collectionId: 'nonexistent',
          name: 'Test',
          type: 'FLOAT',
          value: 10,
        })
      ).rejects.toThrow('Collection not found: nonexistent');
    });

    it('wraps creation errors with context', async () => {
      (figma.variables.createVariable as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Creation failed');
      });

      await expect(
        manager.createVariableFromToken({
          collectionId: 'collection-1',
          name: 'Failing Variable',
          type: 'FLOAT',
          value: 10,
        })
      ).rejects.toThrow('Failed to create variable "Failing Variable": Creation failed');
    });
  });

  describe('updateVariable', () => {
    it('updates COLOR variable', async () => {
      mockVariable.resolvedType = 'COLOR';

      await manager.updateVariable('var-1', 'mode-1', '#00ff00');

      expect(mockVariable.setValueForMode).toHaveBeenCalledWith('mode-1', {
        r: 0,
        g: 1,
        b: 0,
      });
    });

    it('updates FLOAT variable', async () => {
      mockVariable.resolvedType = 'FLOAT';

      await manager.updateVariable('var-1', 'mode-1', 24);

      expect(mockVariable.setValueForMode).toHaveBeenCalledWith('mode-1', 24);
    });

    it('updates STRING variable', async () => {
      mockVariable.resolvedType = 'STRING';

      await manager.updateVariable('var-1', 'mode-1', 'Roboto');

      expect(mockVariable.setValueForMode).toHaveBeenCalledWith('mode-1', 'Roboto');
    });

    it('updates BOOLEAN variable', async () => {
      mockVariable.resolvedType = 'BOOLEAN';

      await manager.updateVariable('var-1', 'mode-1', false);

      expect(mockVariable.setValueForMode).toHaveBeenCalledWith('mode-1', false);
    });

    it('throws error when variable not found', async () => {
      await expect(manager.updateVariable('nonexistent', 'mode-1', 10)).rejects.toThrow(
        'Variable not found: nonexistent'
      );
    });
  });

  describe('pullVariables', () => {
    beforeEach(() => {
      mockVariable.valuesByMode = { 'mode-1': { r: 1, g: 0, b: 0 } };
      mockVariable.resolvedType = 'COLOR';
    });

    it('pulls all local variables', async () => {
      const variables = await manager.pullVariables();

      expect(figma.variables.getLocalVariableCollectionsAsync).toHaveBeenCalled();
      expect(variables).toHaveProperty('Primary Color');
    });

    it('converts COLOR variables to hex', async () => {
      const variables = await manager.pullVariables();

      expect(variables['Primary Color']).toEqual({
        type: 'color',
        value: '#ff0000',
        variableId: 'var-1',
        collectionId: 'collection-1',
      });
    });

    it('handles FLOAT variables', async () => {
      mockVariable.resolvedType = 'FLOAT';
      mockVariable.valuesByMode = { 'mode-1': 16 };

      const variables = await manager.pullVariables();

      expect(variables['Primary Color']).toEqual({
        type: 'dimension',
        value: 16,
        variableId: 'var-1',
        collectionId: 'collection-1',
      });
    });

    it('handles STRING variables', async () => {
      mockVariable.resolvedType = 'STRING';
      mockVariable.valuesByMode = { 'mode-1': 'Inter' };

      const variables = await manager.pullVariables();

      expect(variables['Primary Color']).toEqual({
        type: 'string',
        value: 'Inter',
        variableId: 'var-1',
        collectionId: 'collection-1',
      });
    });

    it('handles BOOLEAN variables', async () => {
      mockVariable.resolvedType = 'BOOLEAN';
      mockVariable.valuesByMode = { 'mode-1': true };

      const variables = await manager.pullVariables();

      expect(variables['Primary Color']).toEqual({
        type: 'boolean',
        value: true,
        variableId: 'var-1',
        collectionId: 'collection-1',
      });
    });

    it('skips null variables', async () => {
      mockCollection.variableIds = ['var-1', 'nonexistent'];

      const variables = await manager.pullVariables();

      // Should only have one variable
      expect(Object.keys(variables)).toHaveLength(1);
    });
  });

  describe('syncVariables', () => {
    it('creates new variables', async () => {
      mockCollection.variableIds = [];

      const result = await manager.syncVariables(
        {
          'New Color': {
            type: 'color',
            value: '#0000ff',
          },
          'New Spacing': {
            type: 'dimension',
            value: 8,
          },
        },
        'collection-1'
      );

      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('updates existing variables', async () => {
      const result = await manager.syncVariables(
        {
          'Primary Color': {
            type: 'color',
            value: '#00ff00',
          },
        },
        'collection-1'
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('handles mix of new and existing variables', async () => {
      const result = await manager.syncVariables(
        {
          'Primary Color': {
            type: 'color',
            value: '#00ff00',
          },
          'New Color': {
            type: 'color',
            value: '#0000ff',
          },
        },
        'collection-1'
      );

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('collects errors without stopping sync', async () => {
      (figma.variables.createVariable as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Failed to create');
      });

      const result = await manager.syncVariables(
        {
          'Failing Variable': {
            type: 'color',
            value: '#ff0000',
          },
          'Primary Color': {
            type: 'color',
            value: '#00ff00',
          },
        },
        'collection-1'
      );

      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        name: 'Failing Variable',
        error: expect.stringContaining('Failed to create'),
      });
    });

    it('throws error when collection not found', async () => {
      await expect(
        manager.syncVariables(
          { Test: { type: 'color', value: '#ff0000' } },
          'nonexistent'
        )
      ).rejects.toThrow('Collection not found: nonexistent');
    });

    it('maps token types to variable types correctly', async () => {
      mockCollection.variableIds = [];

      await manager.syncVariables(
        {
          'Color Token': { type: 'color', value: '#ff0000' },
          'Dimension Token': { type: 'dimension', value: 16 },
          'Spacing Token': { type: 'spacing', value: 8 },
          'Opacity Token': { type: 'opacity', value: 0.5 },
          'Number Token': { type: 'number', value: 100 },
          'String Token': { type: 'string', value: 'value' },
          'Boolean Token': { type: 'boolean', value: true },
        },
        'collection-1'
      );

      const calls = (figma.variables.createVariable as jest.Mock).mock.calls;
      expect(calls.find((c) => c[0] === 'Color Token')[2]).toBe('COLOR');
      expect(calls.find((c) => c[0] === 'Dimension Token')[2]).toBe('FLOAT');
      expect(calls.find((c) => c[0] === 'Spacing Token')[2]).toBe('FLOAT');
      expect(calls.find((c) => c[0] === 'Opacity Token')[2]).toBe('FLOAT');
      expect(calls.find((c) => c[0] === 'Number Token')[2]).toBe('FLOAT');
      expect(calls.find((c) => c[0] === 'String Token')[2]).toBe('STRING');
      expect(calls.find((c) => c[0] === 'Boolean Token')[2]).toBe('BOOLEAN');
    });
  });

  describe('color parsing', () => {
    it('parses hex colors correctly', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'COLOR',
        value: '#ff8800',
      });

      const call = (figma.variables.createVariable as jest.Mock).mock.results[0].value;
      expect(call.setValueForMode).toHaveBeenCalled();

      const setValue = call.setValueForMode.mock.calls[0][1];
      expect(setValue.r).toBeCloseTo(1, 2);
      expect(setValue.g).toBeCloseTo(0.533, 2);
      expect(setValue.b).toBeCloseTo(0, 2);
    });

    it('parses rgb colors correctly', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'COLOR',
        value: 'rgb(128, 64, 32)',
      });

      const call = (figma.variables.createVariable as jest.Mock).mock.results[0].value;
      const setValue = call.setValueForMode.mock.calls[0][1];

      expect(setValue.r).toBeCloseTo(0.502, 2);
      expect(setValue.g).toBeCloseTo(0.251, 2);
      expect(setValue.b).toBeCloseTo(0.125, 2);
    });

    it('defaults to black for invalid colors', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'COLOR',
        value: 'invalid-color',
      });

      const call = (figma.variables.createVariable as jest.Mock).mock.results[0].value;
      const setValue = call.setValueForMode.mock.calls[0][1];

      expect(setValue).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('integration scenarios', () => {
    it('handles complete variable management workflow', async () => {
      // Pull existing variables
      const existingVariables = await manager.pullVariables();
      expect(Object.keys(existingVariables)).toHaveLength(1);

      // Sync with new tokens
      const syncResult = await manager.syncVariables(
        {
          'Primary Color': {
            type: 'color',
            value: '#00ff00',
          },
          'New Color': {
            type: 'color',
            value: '#0000ff',
          },
        },
        'collection-1'
      );

      expect(syncResult.created).toBe(1);
      expect(syncResult.updated).toBe(1);
      expect(syncResult.errors).toHaveLength(0);
    });

    it('handles empty token set gracefully', async () => {
      const result = await manager.syncVariables({}, 'collection-1');

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('converts float string to number', async () => {
      await manager.createVariableFromToken({
        collectionId: 'collection-1',
        name: 'Test',
        type: 'FLOAT',
        value: '16.5',
      });

      const call = (figma.variables.createVariable as jest.Mock).mock.results[0].value;
      expect(call.setValueForMode).toHaveBeenCalledWith('mode-1', 16.5);
    });
  });
});
