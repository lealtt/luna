import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";
import type enCommon from "#enJson";
import type enCommands from "#enCommandsJson";

// Recursive type for dot-notation keys
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

// Merge types from both en-US files for comprehensive type checking
type MergedEN = typeof enCommon & typeof enCommands;

// Type for i18n keys, generated from the merged English translation files
export type I18nKey = DotNestedKeys<MergedEN>;

// Supported and fallback locales
const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

// In-memory store for translations
const resources: Record<string, Record<string, any>> = {};

/**
 * Safely checks if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely loads a JSON file, returning undefined if it fails or doesn't exist.
 */
async function loadJsonFile(filePath: string): Promise<Record<string, any> | undefined> {
  if (!(await fileExists(filePath))) {
    return undefined;
  }
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    logger.warn(`Failed to load or parse JSON file at ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Initializes the i18n system by loading and merging translation files.
 * The system is now mandatory. If core files for the fallback language are missing,
 * the application will exit.
 */
export async function setupI18n() {
  // Clear resources to allow re-initialization
  Object.keys(resources).forEach((key) => delete resources[key]);

  const localesDir = path.resolve(process.cwd(), "locales");

  // Load and merge translations for each supported language
  const loadPromises = supportedLngs.map(async (lang) => {
    const commonPath = path.join(localesDir, lang, "common.json");
    const commandsPath = path.join(localesDir, lang, "commands.json");

    const commonContent = await loadJsonFile(commonPath);
    const commandsContent = await loadJsonFile(commandsPath);

    // Ensure the fallback language has all its files, as it's the source of truth
    if (lang === fallbackLng && (!commonContent || !commandsContent)) {
      logger.error(
        `Core translation files for fallback language "${fallbackLng}" are missing. Exiting.`,
      );
      process.exit(1);
    }

    // Merge both files into one resource object for the language
    if (commonContent || commandsContent) {
      resources[lang] = { ...commonContent, ...commandsContent };
    }
  });

  await Promise.all(loadPromises);

  const loadedLangs = Object.keys(resources);
  if (loadedLangs.length > 0) {
    logger.info(`Successfully loaded translations for: ${loadedLangs.join(", ")}`);
  } else {
    logger.error("No translation files found. The i18n system is mandatory. Exiting.");
    process.exit(1);
  }
}

/**
 * Safely retrieves a nested property from an object using a dot-notation key.
 */
function getNestedValue(obj: Record<string, any>, key: string): string | undefined {
  return key
    .split(".")
    .reduce<any>((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
}

/**
 * Gets a translated string for a given key.
 * @param lng The language to use (e.g., "en-US").
 * @param key The translation key (e.g., "ping.reply").
 * @param variables Optional variables for interpolation.
 * @returns The translated string, falling back to the default language or the key itself.
 */
export function t(lng: string, key: I18nKey, variables?: Record<string, any>): string {
  let text: string | undefined;

  // Normalize language code (e.g., "en_US" to "en-US")
  const normalizedLng = lng.replace("_", "-");

  // Try to get translation from the requested language's resources
  const langFile = resources[normalizedLng];
  if (langFile) text = getNestedValue(langFile, key);

  // Fallback to the default language if not found in the requested one
  if (text === undefined && normalizedLng !== fallbackLng) {
    const fallbackFile = resources[fallbackLng];
    if (fallbackFile) text = getNestedValue(fallbackFile, key);
  }

  // If still not found, log a warning and return the key as a last resort
  if (text === undefined) {
    logger.warn(`Translation key not found: "${key}"`);
    text = key;
  }

  // Interpolate variables safely
  if (!variables) return text;
  return text.replace(/{{(\w+)}}/g, (_, varName) => {
    const value = variables[varName];
    return value != null ? String(value) : "";
  });
}

/**
 * Generates a localization map for a given translation key.
 * @param key The translation key.
 * @returns A map of locale codes to translated strings, excluding fallbacks.
 */
export function getLocalizations(key: I18nKey): Record<string, string> {
  const localizations: Record<string, string> = {};
  const fallbackText = getNestedValue(resources[fallbackLng], key);

  for (const lang of supportedLngs) {
    if (lang === fallbackLng) continue;

    const langFile = resources[lang];
    const translation = langFile ? getNestedValue(langFile, key) : undefined;

    // Add translation if it exists and is different from the fallback text
    if (translation && translation !== fallbackText) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
