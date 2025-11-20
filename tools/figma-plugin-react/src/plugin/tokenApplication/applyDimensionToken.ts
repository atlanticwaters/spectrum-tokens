export async function applyDimensionToken(node: SceneNode, value: number): Promise<void> {
  // Apply width/height to nodes that support sizing
  if ('resize' in node && typeof node.resize === 'function') {
    // Preserve aspect ratio by default
    const aspectRatio = node.width / node.height;
    node.resize(value, value / aspectRatio);
  } else if ('width' in node && 'height' in node) {
    // Direct property access for nodes without resize method
    // Apply to width, preserve height
    // Use type assertion since Figma types are strict
    (node as any).width = value;
  } else {
    throw new Error('Node does not support dimension tokens');
  }
}
