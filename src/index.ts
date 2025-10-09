import { lunaBootstrap } from "#discord";
import { logger, setupI18n } from "#utils";
import { GatewayIntentBits as Intents, Partials } from "discord.js";

await setupI18n().catch(logger.error);

await lunaBootstrap({
  intents: Object.values(Intents).filter((v): v is Intents => typeof v === "number"),
  partials: Object.values(Partials).filter((v): v is Partials => typeof v === "number"),
  baseURL: import.meta.url,
});
