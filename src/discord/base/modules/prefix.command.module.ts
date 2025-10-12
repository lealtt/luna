import type { Middleware } from "./middleware.module.js";
import type { Message } from "discord.js";
import { z } from "zod";
import { logger } from "#utils";

//Types and Interfaces
export type FlagConfig<T extends z.ZodObject<any>> = {
  [K in keyof T["shape"]]?: {
    aliases?: string[];
    separator?: string;
  };
};

export interface FlagsObject<T extends z.ZodObject<any>> {
  schema: T;
  config?: FlagConfig<T>;
}

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
  ) => Promise<void> | void;
}

export const prefixCommandRegistry = new Map<string, PrefixCommand<any>>();

/**
 * Parses command flags from a raw input string.
 * @param input The raw argument string.
 * @param flagsObject The schema and configuration for flags.
 * @returns A record of flag keys and their values.
 */
export function parseFlags<T extends z.ZodObject<any>>(
  input: string,
  flagsObject?: FlagsObject<T>,
): z.infer<T> | Record<string, string> {
  const flags: Record<string, string> = {};
  let remainingInput = ` ${input.trim()}`;
  const aliasMap = new Map<string, string>();

  if (flagsObject?.config) {
    for (const mainFlag in flagsObject.config) {
      aliasMap.set(mainFlag, mainFlag);
      const aliases = flagsObject.config[mainFlag]?.aliases ?? [];
      for (const alias of aliases) {
        aliasMap.set(alias, mainFlag);
      }
    }
  }

  // Parse separator-based flags
  if (flagsObject?.config) {
    for (const flagKey in flagsObject.config) {
      const config = flagsObject.config[flagKey];
      const separator = config?.separator ?? ":";
      const allNames = [flagKey, ...(config?.aliases ?? [])];
      const regex = new RegExp(
        `\\s(${allNames.join("|")})${separator}\\s*(?:"([^"]*)"|(\\S+))`,
        "g",
      );
      try {
        remainingInput = remainingInput.replace(
          regex,
          (_match, key, quotedValue, unquotedValue) => {
            const mainFlag = aliasMap.get(key)!;
            flags[mainFlag] = quotedValue ?? unquotedValue;
            return "";
          },
        );
      } catch (error) {
        logger.warn(`Invalid regex for flag "${flagKey}":`, error);
        throw new Error(`Failed to parse flag "${flagKey}" due to invalid pattern.`);
      }
    }
  }

  // Parse space-prefixed flags
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

  // Fallback for single-argument commands without flag syntax
  if (Object.keys(flags).length === 0 && flagsObject?.schema) {
    const schemaKeys = Object.keys(flagsObject.schema.shape);

    const requiredStringKeys = schemaKeys.filter((key) => {
      const field = flagsObject.schema.shape[key];
      const isRequired = !field.safeParse(undefined).success;
      const isString = field instanceof z.ZodString;
      return isRequired && isString;
    });

    if (requiredStringKeys.length === 1) {
      const key = requiredStringKeys[0];
      const fullInput = input.trim();
      if (fullInput) {
        flags[key] = fullInput;
      }
    }
  }

  // Validate flags with schema
  if (flagsObject?.schema) {
    const result = flagsObject.schema.safeParse(flags);
    if (!result.success) throw result.error;
    return result.data;
  }

  return flags;
}

/**
 * Creates and registers a prefix-based command with runtime validation.
 * @param command The command configuration.
 */
export function createPrefixCommand<T extends z.ZodObject<any> | undefined>(
  command: PrefixCommand<T>,
): void {
  if (!command.name) {
    throw new Error("Command name cannot be empty.");
  }
  if (command.aliases?.some((alias) => !alias || alias === command.name)) {
    throw new Error(
      `Invalid aliases for command "${command.name}". Aliases must be non-empty and distinct from the command name.`,
    );
  }
  if (command.guilds?.some((id) => !/^\d+$/.test(id))) {
    throw new Error(`Invalid guild ID in command "${command.name}". Guild IDs must be numeric.`);
  }
  if (typeof command.run !== "function") {
    throw new Error(`Command "${command.name}" must have a valid run function.`);
  }

  try {
    prefixCommandRegistry.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        if (prefixCommandRegistry.has(alias)) {
          throw new Error(`Alias "${alias}" for command "${command.name}" is already registered.`);
        }
        prefixCommandRegistry.set(alias, command);
      }
    }
    logger.module(
      `Registered prefix command: ?${command.name} (aliases: ${command.aliases?.join(", ") ?? "none"})`,
    );
  } catch (error) {
    logger.error(`Failed to register prefix command "${command.name}":`, error);
    throw error;
  }
}
