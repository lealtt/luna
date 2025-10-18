import { StateManager } from "#discord/structures";
import { Timer } from "#utils";
import type { Locale } from "discord.js";
import { onBotEvent, BotLifecycle } from "#discord/hooks";

export const localeState = new StateManager<{ locale: Locale | null }>({
  name: "UserLocaleCache",
  maxSize: 5000,
  defaultTTL: Timer(5).min(),
  cleanupInterval: Timer(1).min(),
  trackAccess: true,
});

onBotEvent(
  BotLifecycle.BeforeShutdown,
  () => {
    localeState.destroy();
  },
  { name: "locale-state-shutdown", silent: true },
);
