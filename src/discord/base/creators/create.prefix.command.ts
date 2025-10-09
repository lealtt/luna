import { registerPrefixCommand, type PrefixCommand } from "#discord/registry";
import type { z } from "zod";

/**
 * Creates and registers a new prefix command.
 * Infers the argument type based on the provided Zod schema for flags.
 */
export function createPrefixCommand<T extends z.ZodObject<any> | undefined>(
  options: PrefixCommand<T>,
): void {
  registerPrefixCommand(options);
}
