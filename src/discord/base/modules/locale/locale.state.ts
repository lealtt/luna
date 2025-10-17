import { StateManager } from "#discord/structures";
import { Timer } from "#utils";
import type { Locale } from "discord.js";

export const localeState = new StateManager<{ locale: Locale | null }>({
  name: "UserLocaleCache",
  maxSize: 5000,
  defaultTTL: Timer(5).min(),
  cleanupInterval: Timer(1).min(),
  trackAccess: true,
});
