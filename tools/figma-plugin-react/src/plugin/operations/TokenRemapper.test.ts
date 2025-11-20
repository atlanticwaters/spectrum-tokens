import { TokenRemapper, RemapOperation } from './TokenRemapper';

// Mock Figma API
const mockPage = {
  id: 'page1',
  name: 'Page 1',
  type: 'PAGE',
  children: [] as any[],
};

// Mock the Figma API globally
(global as any).figma = {
  currentPage: mockPage,
  getLocalPaintStyles: jest.fn(),
  getLocalTextStyles: jest.fn(),
  getLocalEffectStyles: jest.fn(),
  variables: {
    getLocalVariableCollectionsAsync: jest.fn(),
    getVariableByIdAsync: jest.fn(),
  },
} as any;

describe('TokenRemapper', () => {
  let remapper: TokenRemapper;

  beforeEach(() => {
    remapper = new TokenRemapper();
    jest.clearAllMocks();
    // Reset mock page children
    ((global as any).figma.currentPage as any).children = [];
  });

  describe('remapToken', () => {
    it('remaps a single token successfully', async () => {
      const operation: RemapOperation = {
        oldTokenName: 'old-token',
        newTokenName: 'new-token',
      };

      // Mock nodes
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('["old-token","other-token"]'),
        setPluginData: jest.fn(),
      };

      (figma.currentPage as any).children = [mockNode as any];

      // Mock styles
      const mockStyle = {
        name: 'old-token',
        getPluginData: jest.fn().mockReturnValue('old-token'),
        setPluginData: jest.fn(),
      };

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([mockStyle]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);

      // Mock variables
      const mockVariable = {
        name: 'old-token',
        getPluginData: jest.fn().mockReturnValue('old-token'),
        setPluginData: jest.fn(),
      };

      const mockCollection = {
        variableIds: ['var1'],
      };

      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([mockCollection]);
      (figma.variables.getVariableByIdAsync as jest.Mock).mockResolvedValue(mockVariable);

      const result = await remapper.remapToken(operation);

      expect(result.nodesUpdated).toBe(1);
      expect(result.stylesUpdated).toBeGreaterThan(0);
      expect(result.variablesUpdated).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it('handles errors gracefully', async () => {
      const operation: RemapOperation = {
        oldTokenName: 'old-token',
        newTokenName: 'new-token',
      };

      // Mock node that throws error
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('["old-token"]'),
        setPluginData: jest.fn().mockImplementation(() => {
          throw new Error('Failed to set plugin data');
        }),
      };

      (figma.currentPage as any).children = [mockNode as any];

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);
      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([]);

      const result = await remapper.remapToken(operation);

      expect(result.nodesUpdated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].nodeId).toBe('node1');
      expect(result.errors[0].error).toContain('Failed to update node');
    });

    it('returns zero counts when no tokens found', async () => {
      const operation: RemapOperation = {
        oldTokenName: 'non-existent-token',
        newTokenName: 'new-token',
      };

      (figma.currentPage as any).children = [];
      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);
      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([]);

      const result = await remapper.remapToken(operation);

      expect(result.nodesUpdated).toBe(0);
      expect(result.stylesUpdated).toBe(0);
      expect(result.variablesUpdated).toBe(0);
      expect(result.errors).toEqual([]);
    });
  });

  describe('bulkRemapTokens', () => {
    it('remaps multiple tokens', async () => {
      const operations: RemapOperation[] = [
        { oldTokenName: 'token1', newTokenName: 'new-token1' },
        { oldTokenName: 'token2', newTokenName: 'new-token2' },
      ];

      // Mock nodes
      const mockNode1 = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('["token1"]'),
        setPluginData: jest.fn(),
      };

      const mockNode2 = {
        id: 'node2',
        getPluginData: jest.fn().mockReturnValue('["token2"]'),
        setPluginData: jest.fn(),
      };

      (figma.currentPage as any).children = [mockNode1, mockNode2] as any;

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);
      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([]);

      const result = await remapper.bulkRemapTokens(operations);

      expect(result.nodesUpdated).toBe(2);
      expect(result.errors).toEqual([]);
    });

    it('aggregates errors from multiple operations', async () => {
      const operations: RemapOperation[] = [
        { oldTokenName: 'token1', newTokenName: 'new-token1' },
        { oldTokenName: 'token2', newTokenName: 'new-token2' },
      ];

      // Mock nodes that throw errors
      const mockNode1 = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('["token1"]'),
        setPluginData: jest.fn().mockImplementation(() => {
          throw new Error('Error 1');
        }),
      };

      const mockNode2 = {
        id: 'node2',
        getPluginData: jest.fn().mockReturnValue('["token2"]'),
        setPluginData: jest.fn().mockImplementation(() => {
          throw new Error('Error 2');
        }),
      };

      (figma.currentPage as any).children = [mockNode1, mockNode2] as any;

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);
      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([]);

      const result = await remapper.bulkRemapTokens(operations);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].nodeId).toBe('node1');
      expect(result.errors[1].nodeId).toBe('node2');
    });
  });

  describe('findNodesUsingToken', () => {
    it('finds nodes with matching token in plugin data', async () => {
      const mockNode1 = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('test-token'),
      };

      const mockNode2 = {
        id: 'node2',
        getPluginData: jest.fn().mockReturnValue('other-token'),
      };

      (figma.currentPage as any).children = [mockNode1, mockNode2];

      // Access private method via any cast for testing
      const nodes = await (remapper as any).findNodesUsingToken('test-token');

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('node1');
    });

    it('traverses nested children', async () => {
      const mockGrandchild = {
        id: 'grandchild',
        getPluginData: jest.fn().mockReturnValue('nested-token'),
      };

      const mockChild = {
        id: 'child',
        getPluginData: jest.fn().mockReturnValue(''),
        children: [mockGrandchild],
      };

      (figma.currentPage as any).children = [mockChild];

      const nodes = await (remapper as any).findNodesUsingToken('nested-token');

      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('grandchild');
    });
  });

  describe('updateStylesToken', () => {
    it('updates style names containing token', async () => {
      const mockStyle1 = {
        name: 'old-token-primary',
        getPluginData: jest.fn().mockReturnValue(''),
        setPluginData: jest.fn(),
      };

      const mockStyle2 = {
        name: 'old-token',
        getPluginData: jest.fn().mockReturnValue('old-token'),
        setPluginData: jest.fn(),
      };

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([mockStyle1, mockStyle2]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);

      const count = await (remapper as any).updateStylesToken('old-token', 'new-token');

      expect(count).toBeGreaterThan(0);
      expect(mockStyle1.name).toBe('new-token-primary');
      expect(mockStyle2.name).toBe('new-token');
    });

    it('updates style plugin data', async () => {
      const mockStyle = {
        name: 'some-style',
        getPluginData: jest.fn().mockReturnValue('old-token'),
        setPluginData: jest.fn(),
      };

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([mockStyle]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);

      await (remapper as any).updateStylesToken('old-token', 'new-token');

      expect(mockStyle.setPluginData).toHaveBeenCalledWith('sourceToken', 'new-token');
    });
  });

  describe('updateVariablesToken', () => {
    it('updates variable names', async () => {
      const mockVariable = {
        name: 'old-token',
        getPluginData: jest.fn().mockReturnValue(''),
        setPluginData: jest.fn(),
      };

      const mockCollection = {
        variableIds: ['var1'],
      };

      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([mockCollection]);
      (figma.variables.getVariableByIdAsync as jest.Mock).mockResolvedValue(mockVariable);

      const count = await (remapper as any).updateVariablesToken('old-token', 'new-token');

      expect(count).toBe(1);
      expect(mockVariable.name).toBe('new-token');
    });

    it('handles null variables gracefully', async () => {
      const mockCollection = {
        variableIds: ['var1', 'var2'],
      };

      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([mockCollection]);
      (figma.variables.getVariableByIdAsync as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ name: 'old-token', getPluginData: jest.fn(), setPluginData: jest.fn() });

      const count = await (remapper as any).updateVariablesToken('old-token', 'new-token');

      expect(count).toBe(1);
    });
  });

  describe('previewRemap', () => {
    it('returns preview counts without making changes', async () => {
      const operation: RemapOperation = {
        oldTokenName: 'preview-token',
        newTokenName: 'new-token',
      };

      // Mock node
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('preview-token'),
        setPluginData: jest.fn(),
      };

      (figma.currentPage as any).children = [mockNode] as any;

      // Mock style
      const mockStyle = {
        name: 'preview-token',
        getPluginData: jest.fn().mockReturnValue(''),
        setPluginData: jest.fn(),
      };

      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([mockStyle]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);

      // Mock variable
      const mockVariable = {
        name: 'preview-token',
        getPluginData: jest.fn(),
        setPluginData: jest.fn(),
      };

      const mockCollection = {
        variableIds: ['var1'],
      };

      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([mockCollection]);
      (figma.variables.getVariableByIdAsync as jest.Mock).mockResolvedValue(mockVariable);

      const preview = await remapper.previewRemap(operation);

      expect(preview.affectedNodes).toBe(1);
      expect(preview.affectedStyles).toBeGreaterThan(0);
      expect(preview.affectedVariables).toBe(1);

      // Verify no actual changes were made
      expect(mockNode.setPluginData).not.toHaveBeenCalled();
      expect(mockStyle.setPluginData).not.toHaveBeenCalled();
    });

    it('returns zero counts for non-existent token', async () => {
      const operation: RemapOperation = {
        oldTokenName: 'non-existent',
        newTokenName: 'new-token',
      };

      (figma.currentPage as any).children = [];
      (figma.getLocalPaintStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalTextStyles as jest.Mock).mockReturnValue([]);
      (figma.getLocalEffectStyles as jest.Mock).mockReturnValue([]);
      (figma.variables.getLocalVariableCollectionsAsync as jest.Mock).mockResolvedValue([]);

      const preview = await remapper.previewRemap(operation);

      expect(preview.affectedNodes).toBe(0);
      expect(preview.affectedStyles).toBe(0);
      expect(preview.affectedVariables).toBe(0);
    });
  });

  describe('updateNodeToken', () => {
    it('updates JSON array token data', async () => {
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('["old-token","other-token"]'),
        setPluginData: jest.fn(),
      };

      await (remapper as any).updateNodeToken(mockNode, 'old-token', 'new-token');

      expect(mockNode.setPluginData).toHaveBeenCalledWith(
        'appliedTokens',
        '["new-token","other-token"]'
      );
    });

    it('updates comma-separated token data', async () => {
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('old-token, other-token'),
        setPluginData: jest.fn(),
      };

      await (remapper as any).updateNodeToken(mockNode, 'old-token', 'new-token');

      expect(mockNode.setPluginData).toHaveBeenCalledWith(
        'appliedTokens',
        '["new-token","other-token"]'
      );
    });

    it('throws error on failure', async () => {
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue('old-token'),
        setPluginData: jest.fn().mockImplementation(() => {
          throw new Error('Plugin data error');
        }),
      };

      await expect(
        (remapper as any).updateNodeToken(mockNode, 'old-token', 'new-token')
      ).rejects.toThrow('Failed to update node node1');
    });

    it('handles missing plugin data', async () => {
      const mockNode = {
        id: 'node1',
        getPluginData: jest.fn().mockReturnValue(''),
        setPluginData: jest.fn(),
      };

      await (remapper as any).updateNodeToken(mockNode, 'old-token', 'new-token');

      // Should not call setPluginData when no token data exists
      expect(mockNode.setPluginData).not.toHaveBeenCalled();
    });
  });
});
