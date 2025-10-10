import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";
import type en from "../../../locales/en-US/common.json";

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
 * Loads all translation files into memory. If the required directories or files
 * do not exist, it creates them to ensure type-safety and autocomplete.
 */
export async function setupI18n() {
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
        resources[lang] = JSON.parse(content);
      } catch {
        // This is now safe to ignore, as the base file is guaranteed to exist.
      }
    }),
  );

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
  if (!i18nInitialized) return key as string;

  const langFile = resources[lng] ?? resources[fallbackLng];

  // Traverse nested keys safely
  const text = (key as string)
    .split(".")
    .reduce<any>((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), langFile);

  if (typeof text !== "string") return key as string;
  if (!variables) return text;

  // Interpolate variables like {{variable}}
  return text.replace(/{{(\w+)}}/g, (_, varName) =>
    varName in variables ? String(variables[varName]) : "",
  );
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
    if (translation !== (key as string)) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
