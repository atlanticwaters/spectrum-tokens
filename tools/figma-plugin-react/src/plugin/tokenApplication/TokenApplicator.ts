export interface ApplyTokenOptions {
  nodeId: string;
  tokenName: string;
  tokenValue: any;
  tokenType: string;
}

export interface ApplyTokenResult {
  success: boolean;
  nodeId: string;
  error?: string;
}

export class TokenApplicator {
  async applyToken(options: ApplyTokenOptions): Promise<ApplyTokenResult> {
    try {
      const node = await figma.getNodeByIdAsync(options.nodeId);
      if (!node) {
        return {
          success: false,
          nodeId: options.nodeId,
          error: 'Node not found',
        };
      }

      // Route to appropriate handler based on token type
      switch (options.tokenType) {
        case 'color':
          await this.applyColorToken(node, options.tokenValue);
          break;
        case 'dimension':
          await this.applyDimensionToken(node, options.tokenValue);
          break;
        case 'typography':
          await this.applyTypographyToken(node, options.tokenValue);
          break;
        case 'spacing':
          await this.applySpacingToken(node, options.tokenValue);
          break;
        default:
          return {
            success: false,
            nodeId: options.nodeId,
            error: `Unsupported token type: ${options.tokenType}`,
          };
      }

      return {
        success: true,
        nodeId: options.nodeId,
      };
    } catch (error) {
      return {
        success: false,
        nodeId: options.nodeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async applyColorToken(node: SceneNode, colorValue: string): Promise<void> {
    // Implementation in separate handler file
    const { applyColorToken } = await import('./applyColorToken');
    await applyColorToken(node, colorValue);
  }

  private async applyDimensionToken(node: SceneNode, value: number): Promise<void> {
    const { applyDimensionToken } = await import('./applyDimensionToken');
    await applyDimensionToken(node, value);
  }

  private async applyTypographyToken(node: SceneNode, value: any): Promise<void> {
    const { applyTypographyToken } = await import('./applyTypographyToken');
    await applyTypographyToken(node, value);
  }

  private async applySpacingToken(node: SceneNode, value: number): Promise<void> {
    const { applySpacingToken } = await import('./applySpacingToken');
    await applySpacingToken(node, value);
  }
}
