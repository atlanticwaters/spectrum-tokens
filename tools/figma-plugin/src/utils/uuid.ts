/**
 * Copyright 2024 Adobe. All rights reserved.
 */

/**
 * UUID Generation for Design Tokens
 * Generates deterministic UUIDs based on Figma variable IDs
 */

import { v5 as uuidv5 } from "uuid";

// Namespace UUID for this plugin (generated once, hardcoded)
const PLUGIN_NAMESPACE = "550e8400-e29b-41d4-a716-446655440000";

/**
 * Generate deterministic UUID for a Figma variable
 * Same variable ID + mode will always produce the same UUID
 *
 * @param variableId - Figma variable ID
 * @param mode - Optional mode name (for multi-mode variables)
 */
export function generateTokenUUID(variableId: string, mode?: string): string {
  const key = mode ? `${variableId}-${mode}` : variableId;
  return uuidv5(key, PLUGIN_NAMESPACE);
}

/**
 * Generate UUID for a token group/collection
 */
export function generateCollectionUUID(collectionId: string): string {
  return uuidv5(collectionId, PLUGIN_NAMESPACE);
}
