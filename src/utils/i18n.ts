import path from "node:path";
import fs from "node:fs/promises";
import { Locale } from "discord.js";
import { logger } from "./logger.js";
import type en from "../../locales/en-US/common.json";

/**
 * A recursive helper type that transforms a nested object into a union
 * of dot-separated key paths.
 *
 * @example
 * type MyType = { a: { b: string }, c: string };
 * type MyKeys = DotNestedKeys<MyType>; // "a.b" | "c"
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
 * The final type representing all possible i18n keys based on the en-US translation file.
 */
export type I18nKey = DotNestedKeys<typeof en>;

const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

const resources: Record<string, any> = {};

/**
 * Loads all translation files into memory.
 */
export async function setupI18n() {
  const localesDir = path.join(process.cwd(), "locales");

  for (const lang of supportedLngs) {
    const langPath = path.join(localesDir, lang, "common.json");
    try {
      const fileContent = await fs.readFile(langPath, "utf-8");
      resources[lang] = JSON.parse(fileContent);
    } catch (error) {
      logger.error(`Failed to load translation file for language: ${lang}`, error);
      process.exit(1);
    }
  }
  logger.success("All translation files loaded successfully.");
}

/**
 * Gets a translated string for a given key.
 * @param lng The language to use.
 * @param key The key to look up (e.g., "ping.reply").
 * @param variables The variables for interpolation.
 * @returns The translated string.
 */
export function t(lng: string, key: I18nKey, variables?: Record<string, any>): string {
  const langFile = resources[lng] ?? resources[fallbackLng];

  const keys = key.split(".");
  let text: any = langFile;
  for (const k of keys) {
    if (text && typeof text === "object" && k in text) {
      text = text[k];
    } else {
      return key;
    }
  }

  if (typeof text !== "string") return key;

  if (!variables) return text;

  return text.replace(/{{(\w+)}}/g, (_, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : "";
  });
}

/**
 * Generates a localization map for a given translation key.
 */
export function getLocalizations(key: I18nKey): Record<string, string> {
  const localizations: Record<string, string> = {};

  for (const lang of supportedLngs.filter((l) => l !== fallbackLng)) {
    const translation = t(lang, key);
    if (translation !== key) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }
  return localizations;
}
