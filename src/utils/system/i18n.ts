import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "../system/logger.js";
import type en from "#enJson";

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

// Type for i18n keys, defaulting to string if en is empty or file doesn't exist
export type I18nKey = typeof en extends undefined
  ? string
  : keyof typeof en extends never
    ? string
    : DotNestedKeys<typeof en>;

// Supported and fallback locales
const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

// In-memory store for translations
const resources: Record<string, Record<string, any>> = {};

// Default error messages (fallback)
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
 * Initializes the i18n system by loading translation files, if they exist.
 * If no files are found, or if the en-US file (#enJson) doesn't exist, the system
 * falls back to default messages or keys.
 */
export async function setupI18n() {
  // Clear resources to allow re-initialization
  Object.keys(resources).forEach((key) => delete resources[key]);

  const localesDir = path.resolve(process.cwd(), "locales");
  const enUsFile = path.join(localesDir, Locale.EnglishUS, "common.json");

  // Check if the en-US file (#enJson) exists
  if (!(await fileExists(enUsFile))) {
    logger.info("en-US translation file (#enJson) not found. Using default messages or keys.");
  }

  // Load translations for each supported language
  const loadPromises = supportedLngs.map(async (lang) => {
    const langPath = path.join(localesDir, lang, "common.json");
    const content = await loadJsonFile(langPath);
    if (content) {
      resources[lang] = content;
    }
  });

  await Promise.all(loadPromises);

  // Ensure fallback language exists, even if empty
  if (!resources[fallbackLng]) {
    resources[fallbackLng] = {};
  }

  const loadedLangs = Object.keys(resources);
  if (loadedLangs.length > 0) {
    logger.info(`Successfully loaded translations for: ${loadedLangs.join(", ")}`);
  } else {
    logger.info("No translation files found. Using default messages or keys.");
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
 * @returns The translated string, falling back to default messages or the key.
 */
export function t(lng: string, key: I18nKey, variables?: Record<string, any>): string {
  let text: string | undefined;

  // Normalize language code (e.g., "en_US" to "en-US")
  const normalizedLng = lng.replace("_", "-");

  // Try to get translation from resources
  const langFile = resources[normalizedLng] ?? resources[fallbackLng];
  if (langFile) text = getNestedValue(langFile, key);
  // Fallback to default error messages
  if (text === undefined) text = defaultErrorMessages[key];
  // Fallback to the key itself
  if (text === undefined) text = key;

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
  for (const lang of supportedLngs) {
    if (lang === fallbackLng) continue;
    const translation = t(lang, key);
    const fallbackMessage = defaultErrorMessages[key] ?? key;
    if (translation !== key && translation !== fallbackMessage) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
