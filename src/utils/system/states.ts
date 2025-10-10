import { z } from "zod";
import { Timer } from "../structures/Timer.js";
import { logger } from "./logger.js";

/**
 * A central Map to store temporary interaction states.
 * The key is the state ID, and the value is the state data.
 */
const stateCache = new Map<string, unknown>();

/**
 * A Map to store the Zod schemas for different types of states.
 * The key is the state name, and the value is the Zod schema.
 */
const schemas = new Map<string, z.ZodTypeAny>();

/**
 * Default TTL (Time To Live) for each state: 15 minutes.
 */
const defaultTTL = Timer(15).min();

/**
 * Defines a new state structure with a Zod schema for validation.
 * @param name The unique name for this state.
 * @param schema The Zod schema that defines the shape of the state data.
 * @returns An object with type-safe `set`, `get`, and `update` methods.
 */
export function defineState<T extends z.ZodTypeAny>(name: string, schema: T) {
  if (schemas.has(name)) {
    logger.warn(`State with name "${name}" is being redefined. This may be unintentional.`);
  }
  schemas.set(name, schema);

  return {
    /**
     * Stores data for this state and returns a unique ID.
     * @param data The data to store, matching the defined schema.
     * @param ttl The time-to-live for this specific state in milliseconds.
     * @returns A unique state ID.
     */
    set: (data: z.infer<T>, ttl: number = defaultTTL): string => {
      const stateId = `${name}:${crypto.randomUUID()}`;
      stateCache.set(stateId, data);

      setTimeout(() => {
        stateCache.delete(stateId);
      }, ttl);

      return stateId;
    },

    /**
     * Retrieves and validates data using a state ID.
     * @param stateId The ID previously returned by `set`.
     * @returns The parsed data if found and valid, otherwise `null`.
     */
    get: (stateId: string): z.infer<T> | null => {
      if (!stateId.startsWith(`${name}:`)) {
        return null;
      }

      const data = stateCache.get(stateId);
      if (data === undefined) {
        return null;
      }

      const result = schema.safeParse(data);
      if (result.success) {
        return result.data;
      }

      logger.error("State validation failed:", result.error);
      return null;
    },

    /**
     * Updates the data for an existing state ID.
     * Does not reset the TTL.
     * @param stateId The ID of the state to update.
     * @param data The new data to store, which must match the schema.
     * @returns `true` if the update was successful, `false` otherwise.
     */
    update: (stateId: string, data: z.infer<T>): boolean => {
      if (!stateId.startsWith(`${name}:`) || !stateCache.has(stateId)) {
        return false;
      }
      stateCache.set(stateId, data);
      return true;
    },
  };
}
