export async function applySpacingToken(node: SceneNode, value: number): Promise<void> {
  // Apply to auto-layout nodes
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    // Apply as padding
    node.paddingLeft = value;
    node.paddingRight = value;
    node.paddingTop = value;
    node.paddingBottom = value;

    // Also apply as item spacing
    node.itemSpacing = value;
  } else {
    throw new Error('Spacing tokens can only be applied to auto-layout frames');
  }
}
