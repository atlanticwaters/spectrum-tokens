import { describe, it, expect, jest } from '@jest/globals';
import { applyDimensionToken } from './applyDimensionToken';

describe('applyDimensionToken', () => {
  it('applies dimension using resize method when available', async () => {
    const mockResize = jest.fn();
    const mockNode = {
      width: 100,
      height: 50,
      resize: mockResize,
    };

    await applyDimensionToken(mockNode as any, 200);

    expect(mockResize).toHaveBeenCalledWith(200, 100);
  });

  it('preserves aspect ratio when using resize', async () => {
    const mockResize = jest.fn();
    const mockNode = {
      width: 400,
      height: 200,
      resize: mockResize,
    };

    await applyDimensionToken(mockNode as any, 800);

    // Aspect ratio is 2:1, so new height should be 400
    expect(mockResize).toHaveBeenCalledWith(800, 400);
  });

  it('applies dimension directly to width when resize is not available', async () => {
    const mockNode = {
      width: 100,
      height: 50,
    };

    await applyDimensionToken(mockNode as any, 200);

    expect(mockNode.width).toBe(200);
    expect(mockNode.height).toBe(50); // Height unchanged
  });

  it('throws error for nodes without dimension support', async () => {
    const mockNode = {};

    await expect(applyDimensionToken(mockNode as any, 100)).rejects.toThrow(
      'Node does not support dimension tokens'
    );
  });

  it('handles square dimensions', async () => {
    const mockResize = jest.fn();
    const mockNode = {
      width: 100,
      height: 100,
      resize: mockResize,
    };

    await applyDimensionToken(mockNode as any, 200);

    expect(mockResize).toHaveBeenCalledWith(200, 200);
  });

  it('handles zero dimensions', async () => {
    const mockResize = jest.fn();
    const mockNode = {
      width: 100,
      height: 50,
      resize: mockResize,
    };

    await applyDimensionToken(mockNode as any, 0);

    expect(mockResize).toHaveBeenCalledWith(0, 0);
  });

  it('handles fractional dimensions', async () => {
    const mockResize = jest.fn();
    const mockNode = {
      width: 100,
      height: 50,
      resize: mockResize,
    };

    await applyDimensionToken(mockNode as any, 123.45);

    expect(mockResize).toHaveBeenCalledWith(123.45, 61.725);
  });
});
