import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";
import enCommon from "#enJson" with { type: "json" };
import enCommands from "#enCommandsJson" with { type: "json" };

const typedTranslations = { enCommon, enCommands } as const;

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

type MergedEN = typeof typedTranslations.enCommon & typeof typedTranslations.enCommands;

/**
 * A strongly-typed union of all available translation keys.
 */
export type I18nKey = DotNestedKeys<MergedEN>;

/**
 * A generic type for the variables object used in translations.
 */
export type TranslationVariables = Record<string, string | number>;

const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

const resources: Record<string, Record<string, any>> = {
  [fallbackLng]: {
    ...typedTranslations.enCommon,
    ...typedTranslations.enCommands,
  },
};

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
 */
export async function setupI18n() {
  const localesDir = path.resolve(process.cwd(), "locales");
  const otherLanguages = supportedLngs.filter((lang) => lang !== fallbackLng);

  const loadPromises = otherLanguages.map(async (lang) => {
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
 * @param lng The language to use (e.g., "en-US").
 * @param key The translation key (e.g., "ping.reply").
 * @param variables An optional object of variables to replace in the string.
 * @returns The translated and formatted string.
 */
export function t(lng: string, key: I18nKey, variables?: TranslationVariables): string {
  let text: string | undefined;

  const normalizedLng = lng.replace("_", "-");
  const langFile = resources[normalizedLng] ?? resources[fallbackLng];
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
export function getLocalizations(key: I18nKey): Record<string, string> {
  const localizations: Record<string, string> = {};
  const fallbackText = getNestedValue(resources[fallbackLng], key);

  for (const lang of supportedLngs) {
    if (lang === fallbackLng) continue;
    const langFile = resources[lang];
    const translation = langFile ? getNestedValue(langFile, key) : undefined;
    if (translation && translation !== fallbackText) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
