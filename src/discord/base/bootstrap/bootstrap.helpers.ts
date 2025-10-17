import { Locale, SnowflakeUtil } from "discord.js";
import { resolve, normalize } from "node:path";
import {
  type BootstrapOptions,
  validIntents,
  validPartials,
  validLocales,
} from "./bootstrap.types.js";

export function validateOptions(options: BootstrapOptions): BootstrapOptions {
  const { intents, partials, guilds, locales } = options;

  return {
    intents: intents.filter((intent) => validIntents.includes(intent)),
    partials: partials.filter((partial) => validPartials.includes(partial)),
    guilds: guilds?.filter(isValidSnowflake),
    locales: {
      default: validLocales.includes(locales.default) ? locales.default : Locale.EnglishUS,
      supported: locales.supported.filter((locale) => validLocales.includes(locale)),
    },
  };
}

export function isValidSnowflake(id: string): boolean {
  return /^[0-9]{17,20}$/.test(id) && SnowflakeUtil.deconstruct(id).timestamp > 0;
}

export function isSafePath(filePath: string, root: string): boolean {
  const resolvedPath = resolve(root, filePath);
  const normalizedRoot = normalize(root);
  return resolvedPath.startsWith(normalizedRoot);
}
