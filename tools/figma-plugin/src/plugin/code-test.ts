/**
 * Minimal test plugin to diagnose loading issues
 */

console.log("Plugin loading...");

try {
  // Show UI
  figma.showUI(__html__, {
    width: 400,
    height: 300,
    title: "Test Plugin",
  });

  console.log("UI shown successfully");

  // Test accessing Figma API
  console.log("Testing Figma API access...");
  const collections = figma.variables?.getLocalVariableCollections?.() || [];
  console.log(`Found ${collections.length} collections`);

  figma.ui.postMessage({
    type: "test",
    message: `Plugin loaded successfully! Found ${collections.length} collections.`,
  });
} catch (error) {
  console.error("Plugin initialization error:", error);
  figma.closePlugin(
    `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
}

figma.ui.onmessage = (msg) => {
  console.log("Received message:", msg);
  if (msg.type === "close") {
    figma.closePlugin();
  }
};

console.log("Plugin initialized");
