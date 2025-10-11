import { lunaBootstrap } from "#discord/bootstrap";
import { GatewayIntentBits as Intents, Partials } from "discord.js";

await lunaBootstrap({
  intents: Object.values(Intents).filter((v): v is Intents => typeof v === "number"),
  partials: Object.values(Partials).filter((v): v is Partials => typeof v === "number"),
  baseURL: import.meta.url,
  /**
   * To disable the translation system at runtime, pass `false` here.
   * Note: The `locales/en-US/common.json` file is still required
   * during development for autocompletion and to allow the project to build successfully.
   */
  useI18n: true,
});
