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

/**
 * Figma Plugin Code (runs in Figma sandbox)
 * This file has access to the Figma API but no DOM access
 */

import type {
  PluginMessage,
  PluginResponse,
  CollectionSelection,
  ExportSettings,
  FigmaVariable,
  FigmaVariableCollection,
} from "../shared/types";
import { exportTokens as runExport } from "../export/exportCoordinator";
import { TokenApplicator } from "./tokenApplication/TokenApplicator";

// Show the plugin UI
figma.showUI(__html__, {
  width: 480,
  height: 600,
  title: "Export Design Tokens",
});

/**
 * Scan all variable collections in the current file
 */
async function scanCollections(): Promise<CollectionSelection[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  const result: CollectionSelection[] = [];

  for (const collection of collections) {
    const modes = collection.modes.map((mode) => mode.name);

    // Get variables asynchronously
    const variables = await Promise.all(
      collection.variableIds.map((id) =>
        figma.variables.getVariableByIdAsync(id),
      ),
    );
    const variableCount = variables.filter((v) => v !== null).length;

    result.push({
      collectionId: collection.id,
      collectionName: collection.name,
      modes,
      selectedModes: [modes[0] || ""], // Default to first mode
      variableCount,
      selected: true, // Default to selected
    });
  }

  return result;
}

/**
 * Convert Figma variable to a serializable format
 * (Figma objects can't be directly sent via postMessage)
 */
function serializeFigmaVariable(variable: Variable): FigmaVariable {
  return {
    id: variable.id,
    name: variable.name,
    resolvedType: variable.resolvedType,
    valuesByMode: variable.valuesByMode,
    description: variable.description,
    hiddenFromPublishing: variable.hiddenFromPublishing,
    scopes: variable.scopes,
    codeSyntax: variable.codeSyntax,
  };
}

/**
 * Convert Figma collection to a serializable format
 */
function serializeFigmaCollection(
  collection: VariableCollection,
): FigmaVariableCollection {
  return {
    id: collection.id,
    name: collection.name,
    modes: collection.modes.map((mode) => ({
      modeId: mode.modeId,
      name: mode.name,
    })),
    defaultModeId: collection.defaultModeId,
    variableIds: collection.variableIds,
  };
}

/**
 * Export tokens based on selected collections and settings
 */
async function exportTokens(
  selections: CollectionSelection[],
  settings: ExportSettings,
): Promise<void> {
  try {
    const selectedCollections = selections.filter((s) => s.selected);

    if (selectedCollections.length === 0) {
      throw new Error("No collections selected for export");
    }

    let processedCount = 0;
    const totalVariables = selectedCollections.reduce(
      (sum, s) => sum + s.variableCount,
      0,
    );

    // Send progress update
    figma.ui.postMessage({
      type: "export-progress",
      payload: {
        current: 0,
        total: totalVariables,
        message: "Starting export...",
      },
    } as PluginResponse);

    // Collect all variables from selected collections
    const allVariables: FigmaVariable[] = [];
    const allCollections: FigmaVariableCollection[] = [];

    // Get all collections once (for efficiency)
    const allFigmaCollections =
      await figma.variables.getLocalVariableCollectionsAsync();

    for (const selection of selectedCollections) {
      const collection = allFigmaCollections.find(
        (c) => c.id === selection.collectionId,
      );

      if (!collection) {
        console.warn(`Collection ${selection.collectionId} not found`);
        continue;
      }

      allCollections.push(serializeFigmaCollection(collection));

      // Get all variables in this collection
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);

        if (!variable) {
          console.warn(`Variable ${variableId} not found`);
          continue;
        }

        allVariables.push(serializeFigmaVariable(variable));

        processedCount++;

        // Send progress update every 10 variables
        if (processedCount % 10 === 0) {
          figma.ui.postMessage({
            type: "export-progress",
            payload: {
              current: processedCount,
              total: totalVariables,
              message: `Processing variable: ${variable.name}`,
            },
          } as PluginResponse);
        }
      }
    }

    // Run the export using the export coordinator
    const exportResult = await runExport(
      allCollections,
      allVariables,
      settings,
      (progress) => {
        // Send progress updates to UI
        figma.ui.postMessage({
          type: "export-progress",
          payload: {
            current: progress.current,
            total: progress.total,
            message: progress.message,
          },
        } as PluginResponse);
      },
    );

    // Send export result to UI for file downloads
    figma.ui.postMessage({
      type: "export-complete",
      payload: {
        success: exportResult.success,
        files: exportResult.files,
        statistics: exportResult.statistics,
        warnings: exportResult.warnings,
        errors: exportResult.errors,
        exportPath: exportResult.exportPath,
      },
    });

    console.log(
      `✅ Exported ${exportResult.statistics.totalTokens} tokens in ${exportResult.files.length} files`,
    );
  } catch (error) {
    console.error("Export failed:", error);

    figma.ui.postMessage({
      type: "export-error",
      payload: {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    } as PluginResponse);
  }
}

/**
 * Token applicator instance
 */
const tokenApplicator = new TokenApplicator();

/**
 * Handle messages from the UI
 */
figma.ui.onmessage = async (msg: PluginMessage) => {
  console.log("📨 Received message:", msg.type);

  switch (msg.type) {
    case "scan-collections": {
      try {
        console.log("Starting collection scan...");
        const collections = await scanCollections();
        console.log("Found collections:", collections.length);

        const response = {
          type: "collections-scanned",
          payload: { collections },
        } as PluginResponse;

        console.log("Sending response to UI...");
        figma.ui.postMessage(response);
        console.log("Response sent successfully");
      } catch (error) {
        console.error("Failed to scan collections:", error);
        figma.ui.postMessage({
          type: "export-error",
          payload: {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to scan collections",
          },
        } as PluginResponse);
      }
      break;
    }

    case "export-tokens": {
      await exportTokens(msg.payload.selections, msg.payload.settings);
      break;
    }

    case "cancel-export": {
      console.log("❌ Export cancelled by user");
      figma.closePlugin("Export cancelled");
      break;
    }

    case "apply-token": {
      try {
        console.log("Applying token:", msg.payload);
        const result = await tokenApplicator.applyToken(msg.payload);

        figma.ui.postMessage({
          type: "token-applied",
          payload: result,
        } as PluginResponse);

        if (result.success) {
          console.log("✅ Token applied successfully");
        } else {
          console.error("❌ Token application failed:", result.error);
        }
      } catch (error) {
        console.error("Failed to apply token:", error);
        figma.ui.postMessage({
          type: "token-applied",
          payload: {
            success: false,
            nodeId: msg.payload.nodeId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        } as PluginResponse);
      }
      break;
    }

    case "get-node-data": {
      try {
        const node = await figma.getNodeByIdAsync(msg.payload.nodeId);
        if (node) {
          const appliedTokensData = node.getPluginData('appliedTokens');
          figma.ui.postMessage({
            type: 'node-data',
            payload: {
              id: node.id,
              name: node.name,
              type: node.type,
              appliedTokens: appliedTokensData ? appliedTokensData.split(',').filter(Boolean) : [],
            },
          } as PluginResponse);
        } else {
          figma.ui.postMessage({
            type: 'node-data',
            payload: null,
          } as PluginResponse);
        }
      } catch (error) {
        console.error('Error getting node data:', error);
        figma.ui.postMessage({
          type: 'node-data',
          payload: null,
        } as PluginResponse);
      }
      break;
    }

    case "clear-node-tokens": {
      try {
        const node = await figma.getNodeByIdAsync(msg.payload.nodeId);
        if (node) {
          node.setPluginData('appliedTokens', '');
          figma.ui.postMessage({
            type: 'node-tokens-cleared',
            payload: { nodeId: node.id },
          } as PluginResponse);
        }
      } catch (error) {
        console.error('Error clearing node tokens:', error);
      }
      break;
    }

    case "remap-token": {
      try {
        const { TokenRemapper } = await import('./operations/TokenRemapper');
        const remapper = new TokenRemapper();
        const result = await remapper.remapToken(msg.payload);
        figma.ui.postMessage({
          type: 'token-remapped',
          payload: result,
        } as PluginResponse);
      } catch (error) {
        console.error('Error remapping token:', error);
        figma.ui.postMessage({
          type: 'token-remap-error',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        } as PluginResponse);
      }
      break;
    }

    case "bulk-remap-tokens": {
      try {
        const { TokenRemapper } = await import('./operations/TokenRemapper');
        const remapper = new TokenRemapper();
        const result = await remapper.bulkRemapTokens(msg.payload.operations);
        figma.ui.postMessage({
          type: 'tokens-remapped',
          payload: result,
        } as PluginResponse);
      } catch (error) {
        console.error('Error bulk remapping tokens:', error);
        figma.ui.postMessage({
          type: 'token-remap-error',
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        } as PluginResponse);
      }
      break;
    }

    case "close-plugin": {
      console.log("👋 Closing plugin");
      figma.closePlugin();
      break;
    }

    default: {
      console.warn("Unknown message type:", (msg as { type: string }).type);
    }
  }
};

// Log plugin initialization
console.log("🚀 Figma Token Exporter Plugin initialized");
