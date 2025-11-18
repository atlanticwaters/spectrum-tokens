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
 * Figma Plugin UI (runs in iframe)
 * This file has DOM access but no access to Figma API
 */

import type {
  PluginMessage,
  PluginResponse,
  CollectionSelection,
  ExportSettings,
} from "../shared/types";
import { DEFAULT_EXPORT_SETTINGS } from "../shared/types";

// ============================================================================
// State Management
// ============================================================================

interface AppState {
  collections: CollectionSelection[];
  settings: ExportSettings;
  isExporting: boolean;
  exportProgress: { current: number; total: number; message: string } | null;
  error: string | null;
}

const state: AppState = {
  collections: [],
  settings: { ...DEFAULT_EXPORT_SETTINGS },
  isExporting: false,
  exportProgress: null,
  error: null,
};

// ============================================================================
// UI Rendering
// ============================================================================

function render() {
  const root = document.getElementById("root");
  if (!root) return;

  if (state.collections.length === 0 && !state.error) {
    root.innerHTML = '<div class="loading">Scanning collections...</div>';
    return;
  }

  root.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; padding: 16px;">
      <header style="margin-bottom: 16px;">
        <h1 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          Export Design Tokens
        </h1>
        <p style="font-size: 12px; color: #666;">
          Select collections to export to Adobe Spectrum format
        </p>
      </header>

      ${state.error ? renderError() : ""}

      <div style="flex: 1; overflow-y: auto; margin-bottom: 16px;">
        ${state.isExporting ? renderProgress() : renderCollections()}
      </div>

      <footer style="padding-top: 16px; border-top: 1px solid #e0e0e0;">
        ${renderActions()}
      </footer>
    </div>
  `;

  attachEventListeners();
}

function renderError(): string {
  return `
    <div style="padding: 12px; background: #fee; border: 1px solid #fcc; border-radius: 4px; margin-bottom: 16px;">
      <strong style="color: #c00;">Error:</strong>
      <p style="color: #900; margin-top: 4px;">${state.error}</p>
    </div>
  `;
}

function renderCollections(): string {
  if (state.collections.length === 0) {
    return `
      <div style="padding: 24px; text-align: center; color: #999;">
        <p>No variable collections found in this file.</p>
        <p style="font-size: 11px; margin-top: 8px;">
          Create variables in Figma to export them as design tokens.
        </p>
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${state.collections.map((collection, index) => renderCollectionItem(collection, index)).join("")}
    </div>
  `;
}

function renderCollectionItem(
  collection: CollectionSelection,
  index: number,
): string {
  return `
    <div style="
      padding: 12px;
      border: 1px solid ${collection.selected ? "#0d66d0" : "#ddd"};
      border-radius: 4px;
      background: ${collection.selected ? "#f0f7ff" : "#fff"};
    ">
      <label style="display: flex; align-items: start; cursor: pointer; gap: 8px;">
        <input
          type="checkbox"
          data-collection-index="${index}"
          ${collection.selected ? "checked" : ""}
          style="margin-top: 2px;"
        />
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 4px;">
            ${collection.collectionName}
          </div>
          <div style="font-size: 11px; color: #666;">
            ${collection.variableCount} variable${collection.variableCount !== 1 ? "s" : ""}
            ${collection.modes.length > 1 ? ` · ${collection.modes.length} modes` : ""}
          </div>
          ${collection.modes.length > 1 ? renderModes(collection, index) : ""}
        </div>
      </label>
    </div>
  `;
}

function renderModes(collection: CollectionSelection, index: number): string {
  return `
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0;">
      <div style="font-size: 11px; font-weight: 500; margin-bottom: 4px; color: #666;">
        Modes:
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${collection.modes
          .map(
            (mode) => `
          <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px;">
            <input
              type="checkbox"
              data-mode="${mode}"
              data-collection-index="${index}"
              ${collection.selectedModes.includes(mode) ? "checked" : ""}
              style="margin: 0;"
            />
            ${mode}
          </label>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderProgress(): string {
  if (!state.exportProgress) return "";

  const percent = Math.round(
    (state.exportProgress.current / state.exportProgress.total) * 100,
  );

  return `
    <div style="padding: 24px; text-align: center;">
      <div style="font-weight: 500; margin-bottom: 12px;">
        Exporting tokens...
      </div>
      <div style="
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      ">
        <div style="
          width: ${percent}%;
          height: 100%;
          background: #0d66d0;
          transition: width 0.3s ease;
        "></div>
      </div>
      <div style="font-size: 11px; color: #666;">
        ${state.exportProgress.message}
      </div>
      <div style="font-size: 11px; color: #999; margin-top: 4px;">
        ${state.exportProgress.current} / ${state.exportProgress.total}
      </div>
    </div>
  `;
}

function renderActions(): string {
  const selectedCount = state.collections.filter((c) => c.selected).length;
  const canExport = selectedCount > 0 && !state.isExporting;

  return `
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button
        id="cancel-btn"
        ${state.isExporting ? "disabled" : ""}
      >
        Cancel
      </button>
      <button
        id="export-btn"
        class="primary"
        ${!canExport ? "disabled" : ""}
      >
        ${state.isExporting ? "Exporting..." : `Export ${selectedCount > 0 ? selectedCount : ""} Collection${selectedCount !== 1 ? "s" : ""}`}
      </button>
    </div>
  `;
}

// ============================================================================
// Event Handlers
// ============================================================================

function attachEventListeners() {
  // Collection selection checkboxes
  document
    .querySelectorAll('input[type="checkbox"][data-collection-index]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        const index = parseInt(target.dataset.collectionIndex || "0", 10);

        if (target.dataset.mode) {
          // Mode checkbox
          const mode = target.dataset.mode;
          if (target.checked) {
            state.collections[index]!.selectedModes.push(mode);
          } else {
            state.collections[index]!.selectedModes = state.collections[
              index
            ]!.selectedModes.filter((m) => m !== mode);
          }
        } else {
          // Collection checkbox
          state.collections[index]!.selected = target.checked;
        }

        render();
      });
    });

  // Export button
  const exportBtn = document.getElementById("export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExport);
  }

  // Cancel button
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", handleCancel);
  }
}

function handleExport() {
  if (state.isExporting) return;

  const selectedCollections = state.collections.filter((c) => c.selected);

  if (selectedCollections.length === 0) {
    state.error = "Please select at least one collection to export";
    render();
    return;
  }

  state.error = null;
  state.isExporting = true;
  render();

  // Send export message to plugin code
  const message: PluginMessage = {
    type: "export-tokens",
    payload: {
      selections: selectedCollections,
      settings: state.settings,
    },
  };

  parent.postMessage({ pluginMessage: message }, "*");
}

function handleCancel() {
  const message: PluginMessage = {
    type: "close-plugin",
  };

  parent.postMessage({ pluginMessage: message }, "*");
}

/**
 * Download files to user's computer
 */
function downloadFiles(files: Array<{ filename: string; content: string }>) {
  for (const file of files) {
    downloadFile(file.filename, file.content);
  }
}

/**
 * Download a single file
 */
function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Message Handler (from plugin code)
// ============================================================================

window.onmessage = (event) => {
  try {
    const msg = event.data.pluginMessage as PluginResponse;

    if (!msg || !msg.type) {
      console.error("Invalid message received:", event.data);
      return;
    }

    console.log("📨 UI received message:", msg.type);

    switch (msg.type) {
      case "collections-scanned": {
        state.collections = msg.payload.collections;
        state.isExporting = false;
        render();
        break;
      }

      case "export-progress": {
        state.exportProgress = msg.payload;
        render();
        break;
      }

      case "export-complete": {
        state.isExporting = false;
        state.exportProgress = null;

        // Trigger file downloads
        if (msg.payload.files) {
          downloadFiles(msg.payload.files);
        }

        // Show success message
        const stats = msg.payload.statistics || {};
        const warnings = msg.payload.warnings || [];
        const errors = msg.payload.errors || [];
        const summary = `✅ Successfully exported!

Tokens: ${stats.totalTokens || 0}
Files: ${stats.totalFiles || 0}
${warnings.length ? `Warnings: ${warnings.length}\n` : ""}${errors.length ? `Errors: ${errors.length}\n` : ""}
Files have been downloaded to your Downloads folder.`;

        alert(summary);
        render();
        break;
      }

      case "export-error": {
        state.isExporting = false;
        state.exportProgress = null;
        state.error = msg.payload.error;
        render();
        break;
      }

      default: {
        console.warn("Unknown message type:", msg.type);
        break;
      }
    }
  } catch (error) {
    console.error("Error handling message:", error, event.data);
    state.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    render();
  }
};

// ============================================================================
// Initialization
// ============================================================================

// Initial render
render();

// Request collections scan
const scanMessage: PluginMessage = {
  type: "scan-collections",
};

parent.postMessage({ pluginMessage: scanMessage }, "*");

console.log("🎨 UI initialized");
