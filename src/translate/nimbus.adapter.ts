import type { I18nAdapter, LocaleKeys } from "@lealt/nimbus";
import { Locale } from "discord.js";
import { translations } from "./locales/index.js";

export type AppLocales = LocaleKeys<typeof translations>;

export class LunaLocaleAdapter implements I18nAdapter<AppLocales> {
  private currentLocale: AppLocales = Locale.EnglishUS as AppLocales;

  getCurrentLocale(): AppLocales {
    return this.currentLocale;
  }

  setCurrentLocale(locale: AppLocales): void {
    this.currentLocale = locale;
  }

  resolveLocale(locale: Locale | string | null, appDefaultLocale: AppLocales): AppLocales {
    const localeString = String(locale).replace("_", "-");
    const supportedLocales = Object.keys(translations);

    return (
      supportedLocales.includes(localeString) ? localeString : appDefaultLocale
    ) as AppLocales;
  }
}

export const lunaLocaleAdapter = new LunaLocaleAdapter();
