import {
  createNimbusWithAdapter,
  type Paths,
  type TranslationParams as NimbusParams,
  type LocaleKeys as NimbusLocaleKeys,
} from "@lealt/nimbus";
import { Locale } from "discord.js";
import { translations, type AppTranslations } from "./locales/index.js";
import { logger } from "#utils";
import { lunaLocaleAdapter } from "./nimbus.adapter.js";

type ActualLocaleKeys = NimbusLocaleKeys<typeof translations>;

export type I18nKey = Paths<AppTranslations>;

export type TranslationVariables = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

export let defaultLocale: ActualLocaleKeys = Locale.EnglishUS as ActualLocaleKeys;

export const nimbus = createNimbusWithAdapter(translations, lunaLocaleAdapter, {
  defaultLocale: defaultLocale,
  fallbackLocale: defaultLocale,
});

export function setNimbusDefaultLocale(locale: Locale): void {
  const resolvedLocale = lunaLocaleAdapter.resolveLocale(locale, defaultLocale);
  if (nimbus.hasLocale(resolvedLocale)) {
    if (resolvedLocale !== defaultLocale) {
      defaultLocale = resolvedLocale;
      lunaLocaleAdapter.setCurrentLocale(resolvedLocale);
      nimbus.setLocale(resolvedLocale);
      logger.info(`Default locale set to: ${resolvedLocale}`);
    }
  } else {
    logger.warn(`Attempted to set unsupported locale: ${locale}. Using ${defaultLocale}.`);
  }
}

export function t<K extends I18nKey>(
  key: K,
  ...params: NimbusParams<AppTranslations, K> extends never
    ? []
    : [NimbusParams<AppTranslations, K>]
): string {
  try {
    return (nimbus.t as any)(key, ...(params as any[]));
  } catch (error) {
    logger.error(`Error translating key "${key}" with params: ${JSON.stringify(params)}`, error);
    return `[Translation Error: ${key}]`;
  }
}

export function getLocalizations(
  key: I18nKey,
  baseLocale: Locale = Locale.EnglishUS,
): Record<string, string> {
  const localizations: Record<string, string> = {};
  const supportedLocales = nimbus.getSupportedLocales();
  const baseLocaleKey = lunaLocaleAdapter.resolveLocale(baseLocale, defaultLocale);

  let baseText: string | undefined;
  try {
    baseText = (nimbus.tLocale as any)(baseLocaleKey, key);
    if (baseText?.startsWith("[Missing:") || baseText === key) {
      baseText = undefined;
    }
  } catch (err) {
    logger.error(err);
  }

  for (const lang of supportedLocales) {
    if (lang === baseLocaleKey) continue;

    let translation: string | undefined;
    try {
      translation = (nimbus.tLocale as any)(lang, key);

      if (
        translation &&
        !translation.startsWith("[Missing:") &&
        translation !== key &&
        translation !== baseText
      ) {
        localizations[lang.replace("_", "-")] = translation;
      }
    } catch (err) {
      logger.error(err);
    }
  }

  return localizations;
}

export function isSupportedLocale(locale: Locale | string): boolean {
  const localeString = String(locale).replace("_", "-");
  return nimbus.hasLocale(localeString);
}

export function getSupportedLocales(): Locale[] {
  return nimbus.getSupportedLocales().map((locStr) => locStr as Locale);
}

export * from "./nimbus.adapter.js";
