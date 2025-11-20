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
 * Export Coordinator
 * Orchestrates the complete token export process
 */

import type {
  FigmaVariable,
  FigmaVariableCollection,
  ExportSettings,
} from "../shared/types";
import { convertTokens } from "../mapping/tokenConverter";
import {
  generateDTCGFile,
  generateSpectrumFile,
  generateStyleDictionaryFile,
  generateReadme,
  generateManifest,
  formatFileSize,
  type ExportFile,
} from "./fileGenerator";
import { validateExportSettings } from "../utils/validators";

export interface ExportProgress {
  stage: "scanning" | "converting" | "generating" | "complete";
  message: string;
  current: number;
  total: number;
  percentage: number;
}

export interface ExportResult {
  success: boolean;
  files: ExportFile[];
  statistics: {
    totalTokens: number;
    totalFiles: number;
    totalSize: number;
    collections: number;
    warnings: number;
    errors: number;
  };
  warnings: string[];
  errors: string[];
  exportPath: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * Export Coordinator Class
 */
export class ExportCoordinator {
  private progress: ProgressCallback | null = null;

  constructor(private onProgress?: ProgressCallback) {
    this.progress = onProgress ?? null;
  }

  /**
   * Export tokens to files
   */
  public async export(
    collections: FigmaVariableCollection[],
    variables: FigmaVariable[],
    settings: ExportSettings,
  ): Promise<ExportResult> {
    const files: ExportFile[] = [];
    const allWarnings: string[] = [];
    const allErrors: string[] = [];
    let totalTokens = 0;

    try {
      // Validate settings before starting export
      const settingsValidation = validateExportSettings(settings);
      if (!settingsValidation.valid) {
        for (const error of settingsValidation.errors) {
          allErrors.push(`Export settings error: ${error.message}`);
        }
        throw new Error(
          "Invalid export settings. Please check your configuration.",
        );
      }
      allWarnings.push(...settingsValidation.warnings.map((w) => w.message));

      // Validate input data
      if (collections.length === 0) {
        allWarnings.push("No collections provided for export");
      }

      if (variables.length === 0) {
        allWarnings.push("No variables provided for export");
        // Still allow export to generate README and manifest
      }

      // Stage 1: Scanning
      this.reportProgress({
        stage: "scanning",
        message: "Scanning variables...",
        current: 0,
        total: variables.length,
        percentage: 0,
      });

      // Stage 2: Converting
      this.reportProgress({
        stage: "converting",
        message: "Converting tokens...",
        current: 0,
        total: variables.length,
        percentage: 25,
      });

      // Convert variables to tokens
      const conversionResult = convertTokens({
        settings,
        collections,
        variables,
      });

      totalTokens =
        Object.keys(conversionResult.dtcgTokens).length ||
        Object.keys(conversionResult.spectrumTokens).length;

      allWarnings.push(...conversionResult.warnings);
      allErrors.push(...conversionResult.errors);

      // Stage 3: Generating files
      this.reportProgress({
        stage: "generating",
        message: "Generating files...",
        current: 0,
        total: 4,
        percentage: 50,
      });

      // Generate DTCG file if requested
      if (settings.format === "dtcg" || settings.format === "both") {
        const dtcgFile = generateDTCGFile(
          conversionResult.dtcgTokens,
          settings,
        );
        files.push(dtcgFile);

        this.reportProgress({
          stage: "generating",
          message: "Generated DTCG tokens file",
          current: 1,
          total: 4,
          percentage: 60,
        });
      }

      // Generate Spectrum file if requested
      if (settings.format === "spectrum" || settings.format === "both") {
        const spectrumFile = generateSpectrumFile(
          conversionResult.spectrumTokens,
          settings,
        );
        files.push(spectrumFile);

        this.reportProgress({
          stage: "generating",
          message: "Generated Spectrum tokens file",
          current: 2,
          total: 4,
          percentage: 70,
        });
      }

      // Generate Style Dictionary file if requested
      if (settings.format === "style-dictionary") {
        // Use platform from settings, default to web if not specified
        const platform = settings.styleDictionaryPlatform || 'web';
        const styleDictionaryFile = generateStyleDictionaryFile(
          conversionResult.dtcgTokens,
          settings,
          undefined,
          platform
        );
        files.push(styleDictionaryFile);

        this.reportProgress({
          stage: "generating",
          message: `Generated Style Dictionary tokens file (${platform})`,
          current: 2,
          total: 4,
          percentage: 70,
        });
      }

      // Generate README
      const readme = generateReadme({
        totalTokens,
        collections: collections.length,
        exportDate: new Date().toISOString(),
        warnings: conversionResult.warnings.length,
        errors: conversionResult.errors.length,
      });
      files.push(readme);

      this.reportProgress({
        stage: "generating",
        message: "Generated README",
        current: 3,
        total: 4,
        percentage: 80,
      });

      // Generate manifest
      const manifest = generateManifest(files, settings, {
        totalTokens,
        collections: collections.length,
        warnings: conversionResult.warnings,
        errors: conversionResult.errors,
      });
      files.push(manifest);

      this.reportProgress({
        stage: "generating",
        message: "Generated manifest",
        current: 4,
        total: 4,
        percentage: 90,
      });

      // Stage 4: Complete
      this.reportProgress({
        stage: "complete",
        message: "Export complete!",
        current: files.length,
        total: files.length,
        percentage: 100,
      });

      // Calculate total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return {
        success: allErrors.length === 0,
        files,
        statistics: {
          totalTokens,
          totalFiles: files.length,
          totalSize,
          collections: collections.length,
          warnings: allWarnings.length,
          errors: allErrors.length,
        },
        warnings: allWarnings,
        errors: allErrors,
        exportPath: "/exported-tokens/",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      allErrors.push(`Export failed: ${errorMessage}`);

      return {
        success: false,
        files: [],
        statistics: {
          totalTokens: 0,
          totalFiles: 0,
          totalSize: 0,
          collections: 0,
          warnings: allWarnings.length,
          errors: allErrors.length,
        },
        warnings: allWarnings,
        errors: allErrors,
        exportPath: "",
      };
    }
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: ExportProgress): void {
    if (this.progress) {
      this.progress(progress);
    }
  }

  /**
   * Format export summary for display
   */
  public static formatSummary(result: ExportResult): string {
    const lines: string[] = [];

    lines.push("=".repeat(50));
    lines.push("EXPORT SUMMARY");
    lines.push("=".repeat(50));
    lines.push("");

    if (result.success) {
      lines.push("✅ Export completed successfully!");
    } else {
      lines.push("⚠️ Export completed with errors");
    }

    lines.push("");
    lines.push("STATISTICS:");
    lines.push(`  Tokens exported: ${result.statistics.totalTokens}`);
    lines.push(`  Files generated: ${result.statistics.totalFiles}`);
    lines.push(`  Total size: ${formatFileSize(result.statistics.totalSize)}`);
    lines.push(`  Collections: ${result.statistics.collections}`);
    lines.push(`  Warnings: ${result.statistics.warnings}`);
    lines.push(`  Errors: ${result.statistics.errors}`);

    if (result.files.length > 0) {
      lines.push("");
      lines.push("FILES:");
      for (const file of result.files) {
        lines.push(`  📄 ${file.filename} (${formatFileSize(file.size)})`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push("");
      lines.push("WARNINGS:");
      for (const warning of result.warnings) {
        lines.push(`  ⚠️ ${warning}`);
      }
    }

    if (result.errors.length > 0) {
      lines.push("");
      lines.push("ERRORS:");
      for (const error of result.errors) {
        lines.push(`  ❌ ${error}`);
      }
    }

    lines.push("");
    lines.push(`Export location: ${result.exportPath}`);
    lines.push("");
    lines.push("=".repeat(50));

    return lines.join("\n");
  }
}

/**
 * Convenience function for quick export
 */
export async function exportTokens(
  collections: FigmaVariableCollection[],
  variables: FigmaVariable[],
  settings: ExportSettings,
  onProgress?: ProgressCallback,
): Promise<ExportResult> {
  const coordinator = new ExportCoordinator(onProgress);
  return coordinator.export(collections, variables, settings);
}
