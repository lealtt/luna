import { z } from "zod";
import { Timer } from "../structures/Timer.js";
import { logger } from "./logger.js";

// Central cache for states and their timeouts
const stateCache = new Map<string, { data: unknown; timeout: NodeJS.Timeout }>();
const schemas = new Map<string, z.ZodTypeAny>();

// Default TTL: 15 minutes
const defaultTTL = Timer(15).min();

/**
 * Parses a state ID to extract the state name.
 * @param stateId The state ID (format: `${name}:${uuid}`)
 * @returns The state name or null if invalid
 */
function parseStateId(stateId: string): string | null {
  const [name] = stateId.split(":");
  return name && schemas.has(name) ? name : null;
}

/**
 * Defines a new state structure with a Zod schema for validation.
 * @param name The unique name for this state
 * @param schema The Zod schema defining the state data shape
 * @returns An object with type-safe `set`, `get`, `update`, and `delete` methods
 * @example
 * const userState = defineState("user", z.object({ id: z.string(), name: z.string() }));
 * const id = userState.set({ id: "123", name: "Alice" });
 * console.log(userState.get(id)); // { id: "123", name: "Alice" }
 */
export function defineState<T extends z.ZodTypeAny>(name: string, schema: T) {
  if (schemas.has(name)) {
    logger.warn(`State "${name}" is being redefined. Previous schema will be overwritten.`);
  }
  schemas.set(name, schema);

  return {
    /**
     * Stores data for this state and returns a unique ID.
     * Validates data against the schema before storing.
     * @param data The data to store
     * @param ttl Time-to-live in milliseconds (default: 15 minutes)
     * @returns A unique state ID
     * @throws Error if data fails schema validation
     */
    set: (data: z.infer<T>, ttl: number = defaultTTL): string => {
      const result = schema.safeParse(data);
      if (!result.success) {
        logger.error(`Invalid state data for "${name}": ${JSON.stringify(result.error.issues)}`);
        throw new Error(`State validation failed for "${name}"`);
      }

      const stateId = `${name}:${crypto.randomUUID()}`;
      const timeout = setTimeout(() => {
        stateCache.delete(stateId);
      }, ttl);

      stateCache.set(stateId, { data: result.data, timeout });
      return stateId;
    },

    /**
     * Retrieves and validates data using a state ID.
     * @param stateId The ID returned by `set`
     * @returns The parsed data or null if not found/invalid
     */
    get: (stateId: string): z.infer<T> | null => {
      if (parseStateId(stateId) !== name) return null;

      const entry = stateCache.get(stateId);
      if (!entry) return null;

      const result = schema.safeParse(entry.data);
      if (!result.success) {
        logger.error(
          `State validation failed for "${stateId}": ${JSON.stringify(result.error.issues)}`,
        );
        stateCache.delete(stateId); // Clean up invalid data
        return null;
      }

      return result.data;
    },

    /**
     * Updates data for an existing state ID without resetting TTL.
     * Validates data before updating.
     * @param stateId The ID of the state to update
     * @param data The new data to store
     * @returns True if updated, false if state not found/invalid
     */
    update: (stateId: string, data: z.infer<T>): boolean => {
      if (parseStateId(stateId) !== name || !stateCache.has(stateId)) return false;

      const result = schema.safeParse(data);
      if (!result.success) {
        logger.error(
          `Invalid update data for "${stateId}": ${JSON.stringify(result.error.issues)}`,
        );
        return false;
      }

      const entry = stateCache.get(stateId)!;
      stateCache.set(stateId, { ...entry, data: result.data });
      return true;
    },

    /**
     * Deletes a state from the cache and clears its timeout.
     * @param stateId The ID of the state to delete
     * @returns True if deleted, false if not found
     */
    delete: (stateId: string): boolean => {
      if (parseStateId(stateId) !== name || !stateCache.has(stateId)) return false;

      const entry = stateCache.get(stateId)!;
      clearTimeout(entry.timeout);
      stateCache.delete(stateId);
      return true;
    },
  };
}
