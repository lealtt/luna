import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";
import type en from "#enJson";

/**
 * A recursive helper type that transforms a nested object into a union
 */
type DotNestedKeys<T> = (
  T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | `${K}.${DotNestedKeys<T[K]>}`
          : never;
      }[keyof T]
    : ""
) extends infer D
  ? Extract<D, string>
  : never;

/**
 * The final type representing all possible i18n keys.
 * If the imported 'en' type is an empty object, it defaults to `string`.
 * Otherwise, it generates the specific dot-notation keys for full autocomplete.
 */
export type I18nKey = keyof typeof en extends never ? string : DotNestedKeys<typeof en>;

/** Supported and fallback locales */
const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

/** In-memory store for all loaded translation files */
const resources: Record<string, Record<string, any>> = {};
let i18nInitialized = false;

/**
 * Default error messages in English to be used as a fallback.
 */
const defaultErrorMessages: Record<string, string> = {
  "common_errors.generic": "An unexpected error occurred. Please try again later.",
  "common_errors.cooldown":
    "⏳ Please wait before using {{command}} again. You can reuse it {{time}}.",
  "common_errors.invalid_args": "**Invalid arguments!** Please check your input.\n{{errors}}",
  "common_errors.guild_only": "This command can only be used in a server.",
  "common_errors.missing_permissions":
    "You are missing the required permissions for this command: `{{permissions}}`",
  "common_errors.paginator_expired": "This is not for you or has expired!",
  "common_errors.member_not_found": "Could not find the specified member in this server.",
  "help.command_not_found": "I couldn't find that command.",
};

/**
 * Loads all translation files into memory. If the required directories or files
 * do not exist, it creates them to ensure type-safety and autocomplete.
 */
export async function setupI18n() {
  // Improvement: Add a guard to prevent re-initialization.
  if (i18nInitialized) return;

  const localesDir = path.resolve(process.cwd(), "locales");
  const enUsDir = path.join(localesDir, Locale.EnglishUS);
  const enUsFile = path.join(enUsDir, "common.json");

  try {
    await fs.access(enUsFile);
  } catch {
    logger.warn("Localization file 'locales/en-US/common.json' not found.");
    try {
      await fs.mkdir(enUsDir, { recursive: true });
      await fs.writeFile(enUsFile, "{}");
      logger.success(
        "Created default localization file. Please restart the bot to apply translations.",
      );
    } catch (error) {
      logger.error("Failed to create default localization files:", error);
    }
    return; // Stop further execution, will use default names on next start
  }

  await Promise.all(
    supportedLngs.map(async (lang) => {
      const langPath = path.join(localesDir, lang, "common.json");
      try {
        const content = await fs.readFile(langPath, "utf-8");
        // Improvement: Validate JSON to prevent crashes from malformed files.
        resources[lang] = JSON.parse(content);
      } catch (error) {
        logger.error(`Failed to load or parse locale file for ${lang}:`, error);
        resources[lang] = {}; // Fallback to an empty object on error.
      }
    }),
  );

  // Improvement: Ensure the fallback language resource always exists.
  if (!resources[fallbackLng]) {
    resources[fallbackLng] = {};
  }

  if (Object.keys(resources).length > 0) {
    i18nInitialized = true;
    logger.info(`Successfully loaded translations for: ${Object.keys(resources).join(", ")}`);
  } else {
    logger.warn(
      "No translation files were loaded. The bot will use default command names and descriptions.",
    );
  }
}

/**
 * Gets a translated string for a given key.
 * @param lng The language to use.
 * @param key The key to look up (e.g., "ping.reply").
 * @param variables Optional variables for interpolation.
 * @returns The translated string.
 */
export function t(lng: string, key: I18nKey, variables?: Record<string, any>): string {
  let text: string | undefined;

  // Attempt to get the translation from JSON files if i18n is initialized.
  if (i18nInitialized) {
    // Improvement: Normalize language format for consistency, although discord.js provides it correctly.
    const normalizedLng = lng.replace("_", "-");
    const langFile = resources[normalizedLng] ?? resources[fallbackLng];
    const foundText = (key as string)
      .split(".")
      .reduce<any>((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), langFile);

    if (typeof foundText === "string") {
      text = foundText;
    }
  }

  // If no translation was found, attempt to use the hardcoded fallback.
  if (text === undefined) {
    text = defaultErrorMessages[key as string];
  }

  // If still not found, return the key itself as a last resort.
  if (text === undefined) {
    return key as string;
  }

  // If text was found, interpolate variables like {{variable}}
  if (!variables) return text;
  return text.replace(/{{(\w+)}}/g, (_, varName) => {
    if (varName in variables) {
      return String(variables[varName]);
    }
    return "";
  });
}

/**
 * Generates a localization map for a given translation key.
 * Useful for Discord localization maps.
 */
export function getLocalizations(key: I18nKey): Record<string, string> {
  if (!i18nInitialized) return {};

  const localizations: Record<string, string> = {};
  for (const lang of supportedLngs) {
    if (lang === fallbackLng) continue;
    const translation = t(lang, key);
    // Ensure we only add a localization if it's different from the key AND not a fallback message.
    const fallbackMessage = defaultErrorMessages[key as string];
    if (translation !== (key as string) && translation !== fallbackMessage) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
