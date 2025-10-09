import type { Middleware } from "#discord/base/middleware";
import type { Message } from "discord.js";
import type { z } from "zod";

/**
 * Parses a string of arguments into a key-value object based on flags.
 * Handles quoted strings for multi-word values and spaces after the colon.
 * @param input The raw argument string.
 * @returns A record of flag keys and their string values.
 */
export function parseFlags(input: string): Record<string, string> {
  const flagRegex = /(\w+):\s*(?:"([^"]*)"|(\S+))/g;
  const flags: Record<string, string> = {};
  let match;

  while ((match = flagRegex.exec(input)) !== null) {
    const key = match[1];
    const value = match[2] ?? match[3];
    flags[key] = value;
  }

  return flags;
}

// The PrefixCommand interface is now generic.
export interface PrefixCommand<T extends z.ZodObject<any> | undefined = undefined> {
  name: string;
  aliases?: string[];
  flags?: T;
  cooldown?: number;
  middlewares?: Middleware<Message>[];
  run: (
    message: Message,
    args: T extends z.ZodObject<any> ? z.infer<T> : string[],
  ) => any | Promise<any>;
}

export const prefixCommandRegistry = new Map<string, PrefixCommand<any>>();

export function registerPrefixCommand(command: PrefixCommand<any>) {
  prefixCommandRegistry.set(command.name, command);
  if (command.aliases) {
    for (const alias of command.aliases) {
      prefixCommandRegistry.set(alias, command);
    }
  }
}
