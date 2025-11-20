export interface RemapOperation {
  oldTokenName: string;
  newTokenName: string;
}

export interface RemapResult {
  nodesUpdated: number;
  stylesUpdated: number;
  variablesUpdated: number;
  errors: Array<{ nodeId: string; error: string }>;
}

export class TokenRemapper {
  async remapToken(operation: RemapOperation): Promise<RemapResult> {
    const result: RemapResult = {
      nodesUpdated: 0,
      stylesUpdated: 0,
      variablesUpdated: 0,
      errors: [],
    };

    try {
      // Find all nodes using the old token
      const nodesWithToken = await this.findNodesUsingToken(operation.oldTokenName);

      for (const node of nodesWithToken) {
        try {
          await this.updateNodeToken(node, operation.oldTokenName, operation.newTokenName);
          result.nodesUpdated++;
        } catch (error) {
          result.errors.push({
            nodeId: node.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update styles
      result.stylesUpdated = await this.updateStylesToken(
        operation.oldTokenName,
        operation.newTokenName
      );

      // Update variables
      result.variablesUpdated = await this.updateVariablesToken(
        operation.oldTokenName,
        operation.newTokenName
      );
    } catch (error) {
      throw new Error(
        `Failed to remap token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  async bulkRemapTokens(operations: RemapOperation[]): Promise<RemapResult> {
    const totalResult: RemapResult = {
      nodesUpdated: 0,
      stylesUpdated: 0,
      variablesUpdated: 0,
      errors: [],
    };

    for (const operation of operations) {
      const result = await this.remapToken(operation);
      totalResult.nodesUpdated += result.nodesUpdated;
      totalResult.stylesUpdated += result.stylesUpdated;
      totalResult.variablesUpdated += result.variablesUpdated;
      totalResult.errors.push(...result.errors);
    }

    return totalResult;
  }

  private async findNodesUsingToken(tokenName: string): Promise<SceneNode[]> {
    const nodes: SceneNode[] = [];

    function traverse(node: BaseNode) {
      if ('children' in node) {
        for (const child of node.children) {
          // Check if node has plugin data with token reference
          if ('getPluginData' in child) {
            const tokenData = child.getPluginData('appliedTokens');
            if (tokenData && tokenData.includes(tokenName)) {
              nodes.push(child as SceneNode);
            }
          }
          traverse(child);
        }
      }
    }

    // Search current page
    traverse(figma.currentPage);

    return nodes;
  }

  private async updateNodeToken(
    node: SceneNode,
    oldToken: string,
    newToken: string
  ): Promise<void> {
    // Get current token data
    const tokenData = node.getPluginData('appliedTokens');
    if (!tokenData) return;

    try {
      // Parse token data (assuming it's a JSON array or comma-separated list)
      let tokens: string[];
      try {
        tokens = JSON.parse(tokenData);
      } catch {
        // Fallback to comma-separated
        tokens = tokenData.split(',').map(t => t.trim());
      }

      // Replace old token with new token
      const updatedTokens = tokens.map(t => t === oldToken ? newToken : t);

      // Save back
      const updatedData = JSON.stringify(updatedTokens);
      node.setPluginData('appliedTokens', updatedData);
    } catch (error) {
      throw new Error(`Failed to update node ${node.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateStylesToken(oldToken: string, newToken: string): Promise<number> {
    let count = 0;
    const allStyles = [
      ...figma.getLocalPaintStyles(),
      ...figma.getLocalTextStyles(),
      ...figma.getLocalEffectStyles(),
    ];

    for (const style of allStyles) {
      // Check if style name matches or contains the token name
      if (style.name === oldToken || style.name.includes(oldToken)) {
        style.name = style.name.replace(oldToken, newToken);
        count++;
      }

      // Also check plugin data
      const tokenData = style.getPluginData('sourceToken');
      if (tokenData === oldToken) {
        style.setPluginData('sourceToken', newToken);
        count++;
      }
    }

    return count;
  }

  private async updateVariablesToken(oldToken: string, newToken: string): Promise<number> {
    let count = 0;
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          // Check if variable name matches
          if (variable.name === oldToken || variable.name.includes(oldToken)) {
            variable.name = variable.name.replace(oldToken, newToken);
            count++;
          }

          // Also check if variable has plugin data
          const tokenData = variable.getPluginData?.('sourceToken');
          if (tokenData === oldToken) {
            variable.setPluginData?.('sourceToken', newToken);
          }
        }
      }
    }

    return count;
  }

  /**
   * Find all tokens that would be affected by a remap operation (for preview)
   */
  async previewRemap(operation: RemapOperation): Promise<{
    affectedNodes: number;
    affectedStyles: number;
    affectedVariables: number;
  }> {
    const nodes = await this.findNodesUsingToken(operation.oldTokenName);

    let stylesCount = 0;
    const allStyles = [
      ...figma.getLocalPaintStyles(),
      ...figma.getLocalTextStyles(),
      ...figma.getLocalEffectStyles(),
    ];
    for (const style of allStyles) {
      if (style.name === operation.oldTokenName || style.name.includes(operation.oldTokenName)) {
        stylesCount++;
      }
      const tokenData = style.getPluginData('sourceToken');
      if (tokenData === operation.oldTokenName) {
        stylesCount++;
      }
    }

    let variablesCount = 0;
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable && (variable.name === operation.oldTokenName || variable.name.includes(operation.oldTokenName))) {
          variablesCount++;
        }
      }
    }

    return {
      affectedNodes: nodes.length,
      affectedStyles: stylesCount,
      affectedVariables: variablesCount,
    };
  }
}
