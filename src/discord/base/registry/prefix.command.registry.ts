import type { Middleware } from "#discord/base/middleware";
import type { Message } from "discord.js";
import type { z } from "zod";

/**
 * An object to configure flags, such as defining aliases and custom separators.
 * This type is now generic and its keys are derived from the Zod schema.
 */
export type FlagConfig<T extends z.ZodObject<any>> = {
  // Use a Mapped Type: K can only be one of the keys from the schema's shape.
  [K in keyof T["shape"]]?: {
    aliases?: string[];
    separator?: string; // e.g., ":", "="
  };
};

/**
 * An object that holds both the schema and the configuration for command flags.
 * It's now strongly typed to link the config to the schema.
 */
export interface FlagsObject<T extends z.ZodObject<any>> {
  schema: T;
  config?: FlagConfig<T>;
}

/**
 * A powerful flag parser that handles both separator-based and prefix-based flags.
 * @param input The raw argument string.
 * @param flagConfig The configuration object for flags.
 * @returns A record of flag keys and their string values.
 */
export function parseFlags(
  input: string,
  flagConfig: Record<string, any> = {},
): Record<string, string> {
  let remainingInput = ` ${input}`;
  const flags: Record<string, string> = {};
  const aliasMap = new Map<string, string>();

  // Populate alias map
  for (const mainFlag in flagConfig) {
    aliasMap.set(mainFlag, mainFlag);
    if (flagConfig[mainFlag].aliases) {
      for (const alias of flagConfig[mainFlag].aliases!) {
        aliasMap.set(alias, mainFlag);
      }
    }
  }

  // Handle separator-based flags (e.g., member:@user)
  for (const flagKey in flagConfig) {
    const config = flagConfig[flagKey];
    const separator = config?.separator ?? ":";
    const allNames = [flagKey, ...(config?.aliases || [])];

    const regex = new RegExp(`\\s(${allNames.join("|")})${separator}\\s*(?:"([^"]*)"|(\\S+))`, "g");

    remainingInput = remainingInput.replace(regex, (_match, key, quotedValue, unquotedValue) => {
      const mainFlag = aliasMap.get(key)!;
      flags[mainFlag] = quotedValue ?? unquotedValue;
      return "";
    });
  }

  // Handle space-prefixed flags (--flag value) from the remaining string
  const args = remainingInput.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const spacePrefixedFlags = ["--", "-", "/"];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    let flagName: string | undefined;

    for (const prefix of spacePrefixedFlags) {
      if (arg.startsWith(prefix)) {
        flagName = arg.substring(prefix.length);
        break;
      }
    }

    if (flagName && aliasMap.has(flagName)) {
      const mainFlag = aliasMap.get(flagName)!;
      let value = "true";
      if (i + 1 < args.length && !spacePrefixedFlags.some((p) => args[i + 1].startsWith(p))) {
        value = args[i + 1].replace(/"/g, "");
        i++;
      }
      flags[mainFlag] = value;
    }
  }

  return flags;
}

// The PrefixCommand interface is now strongly typed.
export interface PrefixCommand<T extends z.ZodObject<any> | undefined = undefined> {
  name: string;
  aliases?: string[];
  guilds?: string[];
  flags?: T extends z.ZodObject<any> ? FlagsObject<T> : undefined;
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
