import { z } from "zod";
import { logger } from "#utils";
import { Registry } from "#discord/structures";
import {
  AliasesValidator,
  GuildIdsValidator,
  NameValidator,
  RunFunctionValidator,
} from "../shared/validators.js";
import type { FlagsObject, PrefixCommand } from "./prefix.types.js";

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

  if (flagsObject?.schema) {
    const result = flagsObject.schema.safeParse(flags);
    if (!result.success) throw result.error;
    return result.data;
  }

  return flags;
}

class PrefixCommandRegistry extends Registry<PrefixCommand<any>> {
  private static instance: PrefixCommandRegistry;
  protected readonly registryName = "PrefixCommand";

  protected constructor() {
    super();
  }

  public static getInstance(): PrefixCommandRegistry {
    if (!PrefixCommandRegistry.instance) {
      PrefixCommandRegistry.instance = new PrefixCommandRegistry();
    }
    return PrefixCommandRegistry.instance;
  }

  public register(item: PrefixCommand<any>): void {
    super.register(item);
    if (item.aliases) {
      for (const alias of item.aliases) {
        if (this.store.has(alias)) {
          logger.warn(
            `Alias "${alias}" for command "${item.name}" is already registered and will be ignored.`,
          );
          continue;
        }
        this.store.set(alias, item);
      }
    }
  }

  protected validate(item: PrefixCommand<any>): void {
    const nameValidator = new NameValidator<typeof item>();
    const runFunctionValidator = new RunFunctionValidator<typeof item>();
    const aliasesValidator = new AliasesValidator<typeof item>();
    const guildIdsValidator = new GuildIdsValidator<typeof item>();

    nameValidator
      .setNext(runFunctionValidator)
      .setNext(aliasesValidator)
      .setNext(guildIdsValidator);

    nameValidator.validate(item);

    super.validate(item);
  }
}

export const prefixCommandRegistry = PrefixCommandRegistry.getInstance();

export function createPrefixCommand<T extends z.ZodObject<any> | undefined>(
  command: PrefixCommand<T>,
): void {
  prefixCommandRegistry.register(command);
}
