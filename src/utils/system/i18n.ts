import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";

// Define types from English JSON for key structure
type EnCommon = typeof import("#enJson");
type EnCommands = typeof import("#enCommandsJson");
type MergedEN = EnCommon & EnCommands;

/**
 * A type that recursively generates all possible dot-notation keys from an object.
 * This provides strong typing and autocomplete for translation keys.
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
 * A strongly-typed union of all available translation keys.
 */
export type I18nKey = DotNestedKeys<MergedEN>;

/**
 * A generic type for the variables object used in translations.
 */
export type TranslationVariables = Record<string, string | number>;

// Global resources object
const resources: Record<string, Record<string, any>> = {};

/**
 * Stores the default locale configured during bootstrap.
 * Initialized to EnglishUS, but updated by `setupI18n`.
 * @see setupI18n
 */
export let defaultLocale: Locale = Locale.EnglishUS;

async function loadJsonFile(filePath: string): Promise<Record<string, any> | undefined> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

/**
 * Loads all translation files for the supported languages into memory.
 * @param fallbackLng The fallback language (default: en-US).
 * @param otherSupportedLngs Additional supported languages to load.
 */
export async function setupI18n(
  fallbackLng: Locale = Locale.EnglishUS,
  ...otherSupportedLngs: Locale[]
) {
  defaultLocale = fallbackLng;

  const supportedLngs = [...new Set([fallbackLng, ...otherSupportedLngs])];
  const localesDir = path.resolve(process.cwd(), "locales");

  const loadPromises = supportedLngs.map(async (lang) => {
    const commonPath = path.join(localesDir, lang, "common.json");
    const commandsPath = path.join(localesDir, lang, "commands.json");
    const commonContent = await loadJsonFile(commonPath);
    const commandsContent = await loadJsonFile(commandsPath);

    if (commonContent || commandsContent) {
      resources[lang] = { ...commonContent, ...commandsContent };
    }
  });

  await Promise.all(loadPromises);
  logger.info(`Successfully loaded translations for: ${Object.keys(resources).join(", ")}`);
}

function getNestedValue(obj: Record<string, any>, key: string): string | undefined {
  return key
    .split(".")
    .reduce<any>((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
}

/**
 * Gets a translated string for a given key and interpolates variables.
 * @param lng The language to use ("en-US" or Locale.EnglishUS).
 * @param key The translation key ("ping.reply").
 * @param variables An optional object of variables to replace in the string.
 * @returns The translated and formatted string.
 */
export function t(lng: Locale | string, key: I18nKey, variables?: TranslationVariables): string {
  let text: string | undefined;

  const normalizedLng = String(lng).replace("_", "-");
  const langFile =
    resources[normalizedLng] ?? resources[defaultLocale] ?? resources[Locale.EnglishUS] ?? {};
  text = getNestedValue(langFile, key);

  if (text === undefined) {
    logger.warn(`Translation key not found: "${key}"`);
    text = key;
  }

  if (!variables) return text;
  return text.replace(/{{(\w+)}}/g, (_, varName) => {
    const value = (variables as Record<string, any>)[varName];
    return value != null ? String(value) : "";
  });
}

/**
 * Generates a map of localizations for a given key, for use in Discord command builders.
 * @param key The translation key.
 * @returns A record mapping locales to their translated strings.
 */
export function getLocalizations(
  key: I18nKey,
  baseLocale: Locale = Locale.EnglishUS,
): Record<string, string> {
  const localizations: Record<string, string> = {};

  const baseText = getNestedValue(resources[baseLocale] ?? resources[Locale.EnglishUS] ?? {}, key);

  for (const lang in resources) {
    if (lang === baseLocale) continue;

    const langFile = resources[lang];
    const translation = langFile ? getNestedValue(langFile, key) : undefined;

    if (translation && (baseText === undefined || translation !== baseText)) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }

  return localizations;
}
