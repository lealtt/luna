/*
 * Copyright (c) 2025 Lealt
 *
 * This software is licensed under the MIT License.
 */

import { lunaBootstrap } from "#discord/bootstrap";
import { GatewayIntentBits as Intents, Partials } from "discord.js";

await lunaBootstrap({
  intents: Object.values(Intents).filter((v): v is Intents => typeof v === "number"),
  partials: Object.values(Partials).filter((v): v is Partials => typeof v === "number"),
  /**
   * The i18n (internationalization) system is now a mandatory part of the core.
   * Its previous optional nature caused inconsistencies in the codebase,
   * both in command configurations and response messages.
   */
});
