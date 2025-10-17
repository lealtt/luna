import { models } from "#database";
import { logger } from "#utils";
import { Locale } from "discord.js";
import { localeState } from "./locale.state.js";

export function isValidLocale(locale: string): locale is Locale {
  return Object.values(Locale).includes(locale as Locale);
}

export async function getUserLocale(userId: string): Promise<Locale | null> {
  const cachedEntry = localeState.get(userId);
  if (cachedEntry !== undefined) {
    localeState.touch(userId);
    return cachedEntry.locale;
  }

  try {
    const userDoc = await models.users.findOne({ userId }).select("locale").lean();
    const dbLocaleString = userDoc?.locale ?? null;

    let resolvedLocale: Locale | null = null;
    if (dbLocaleString && isValidLocale(dbLocaleString)) {
      resolvedLocale = dbLocaleString;
    }

    localeState.setWithId(userId, { locale: resolvedLocale });
    return resolvedLocale;
  } catch (error) {
    logger.error(`Failed to fetch locale for user ${userId}:`, error);
    return null;
  }
}

/**
 * Updates the user's preferred locale in the database and clears the cache.
 * @param userId The ID of the user to update.
 * @param localeInput The new locale string ("en-US") or null to reset.
 */
export async function updateUserLocale(
  userId: string,
  localeInput: Locale | string | null,
): Promise<void> {
  let localeToSave: string | null = null;
  let localeToCache: Locale | null = null;

  if (localeInput && isValidLocale(localeInput)) {
    localeToSave = localeInput;
    localeToCache = localeInput;
  } else if (localeInput === null) {
    localeToSave = null;
    localeToCache = null;
  } else {
    localeToSave = null;
    localeToCache = null;
    logger.warn(`Invalid locale provided for user ${userId}: ${localeInput}. Clearing locale.`);
  }

  await models.users.updateProfile(userId, { locale: localeToSave });

  if (localeToCache === null) {
    localeState.delete(userId);
  } else {
    localeState.setWithId(userId, { locale: localeToCache });
  }
}
