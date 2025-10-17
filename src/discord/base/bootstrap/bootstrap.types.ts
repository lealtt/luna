import { GatewayIntentBits, Partials, Locale } from "discord.js";

export interface BootstrapOptions {
  readonly intents: readonly GatewayIntentBits[];
  readonly partials: readonly Partials[];
  readonly guilds?: readonly string[];
  readonly locales: {
    readonly default: Locale;
    readonly supported: readonly Locale[];
  };
}

export const validIntents = Object.values(GatewayIntentBits).filter(
  (v): v is GatewayIntentBits => typeof v === "number",
);
export const validPartials = Object.values(Partials).filter(
  (v): v is Partials => typeof v === "number",
);
export const validLocales = Object.values(Locale);

export interface ModuleCache {
  loaded: Set<string>;
  failed: Set<string>;
  processing: Set<string>;
}
