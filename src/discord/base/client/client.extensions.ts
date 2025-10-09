import { Message, Locale } from "discord.js";
import { userLocaleState } from "#states";

/**
 * Augments the discord.js Message class with a custom getter for 'locale'.
 * This centralizes the logic for getting the locale for prefix commands.
 * Priority: Guild > User Cache > Fallback.
 */
Object.defineProperty(Message.prototype, "locale", {
  get: function (): Locale {
    if (this.guild) return this.guild.preferredLocale;

    const cachedState = userLocaleState.get(this.author.id);
    if (cachedState) {
      return cachedState.locale;
    }

    return Locale.EnglishUS;
  },
});
