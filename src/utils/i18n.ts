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

/** Supported and fallback locales */
const supportedLngs = [Locale.EnglishUS, Locale.PortugueseBR];
const fallbackLng = Locale.EnglishUS;

/** In-memory store for all loaded translation files */
const resources: Record<string, Record<string, any>> = {};

/**
 * Loads all translation files into memory.
 */
export async function setupI18n() {
  const localesDir = path.resolve(process.cwd(), "locales");

  await Promise.all(
    supportedLngs.map(async (lang) => {
      const langPath = path.join(localesDir, lang, "common.json");
      try {
        const content = await fs.readFile(langPath, "utf-8");
        resources[lang] = JSON.parse(content);
      } catch (error) {
        logger.error(`Failed to load translation file for language: ${lang}`, error);
        process.exit(1);
      }
    }),
  );
}

/**
 * Gets a translated string for a given key.
 * @param lng The language to use.
 * @param key The key to look up (e.g., "ping.reply").
 * @param variables Optional variables for interpolation.
 * @returns The translated string.
 */
export function t(lng: string, key: I18nKey, variables?: Record<string, any>): string {
  const langFile = resources[lng] ?? resources[fallbackLng];

  // Traverse nested keys safely
  const text = key
    .split(".")
    .reduce<any>((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), langFile);

  if (typeof text !== "string") return key;

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
  const localizations: Record<string, string> = {};

  for (const lang of supportedLngs) {
    if (lang === fallbackLng) continue;
    const translation = t(lang, key);
    if (translation !== key) {
      localizations[lang.replace("_", "-")] = translation;
    }
  }

  return localizations;
}
