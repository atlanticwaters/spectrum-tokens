import { describe, it, expect } from '@jest/globals';
import { applySpacingToken } from './applySpacingToken';

describe('applySpacingToken', () => {
  it('applies spacing to auto-layout frame', async () => {
    const mockNode = {
      layoutMode: 'HORIZONTAL',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      itemSpacing: 0,
    };

    await applySpacingToken(mockNode as any, 16);

    expect(mockNode.paddingLeft).toBe(16);
    expect(mockNode.paddingRight).toBe(16);
    expect(mockNode.paddingTop).toBe(16);
    expect(mockNode.paddingBottom).toBe(16);
    expect(mockNode.itemSpacing).toBe(16);
  });

  it('applies spacing to vertical auto-layout', async () => {
    const mockNode = {
      layoutMode: 'VERTICAL',
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 8,
      paddingBottom: 8,
      itemSpacing: 4,
    };

    await applySpacingToken(mockNode as any, 24);

    expect(mockNode.paddingLeft).toBe(24);
    expect(mockNode.paddingRight).toBe(24);
    expect(mockNode.paddingTop).toBe(24);
    expect(mockNode.paddingBottom).toBe(24);
    expect(mockNode.itemSpacing).toBe(24);
  });

  it('throws error for nodes without auto-layout', async () => {
    const mockNode = {
      layoutMode: 'NONE',
    };

    await expect(applySpacingToken(mockNode as any, 16)).rejects.toThrow(
      'Spacing tokens can only be applied to auto-layout frames'
    );
  });

  it('throws error for nodes without layoutMode', async () => {
    const mockNode = {};

    await expect(applySpacingToken(mockNode as any, 16)).rejects.toThrow(
      'Spacing tokens can only be applied to auto-layout frames'
    );
  });

  it('handles zero spacing', async () => {
    const mockNode = {
      layoutMode: 'HORIZONTAL',
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 16,
      paddingBottom: 16,
      itemSpacing: 8,
    };

    await applySpacingToken(mockNode as any, 0);

    expect(mockNode.paddingLeft).toBe(0);
    expect(mockNode.paddingRight).toBe(0);
    expect(mockNode.paddingTop).toBe(0);
    expect(mockNode.paddingBottom).toBe(0);
    expect(mockNode.itemSpacing).toBe(0);
  });

  it('handles fractional spacing values', async () => {
    const mockNode = {
      layoutMode: 'HORIZONTAL',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      itemSpacing: 0,
    };

    await applySpacingToken(mockNode as any, 12.5);

    expect(mockNode.paddingLeft).toBe(12.5);
    expect(mockNode.paddingRight).toBe(12.5);
    expect(mockNode.paddingTop).toBe(12.5);
    expect(mockNode.paddingBottom).toBe(12.5);
    expect(mockNode.itemSpacing).toBe(12.5);
  });

  it('handles large spacing values', async () => {
    const mockNode = {
      layoutMode: 'VERTICAL',
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      itemSpacing: 0,
    };

    await applySpacingToken(mockNode as any, 128);

    expect(mockNode.paddingLeft).toBe(128);
    expect(mockNode.paddingRight).toBe(128);
    expect(mockNode.paddingTop).toBe(128);
    expect(mockNode.paddingBottom).toBe(128);
    expect(mockNode.itemSpacing).toBe(128);
  });
});
