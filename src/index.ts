/*
 * Copyright (c) 2025 Lealt
 *
 * This software is licensed under the MIT License.
 */

import { lunaBootstrap } from "#discord/bootstrap";
import { GatewayIntentBits as Intents, Partials, Locale } from "discord.js";

await lunaBootstrap({
  intents: Object.values(Intents).filter((v): v is Intents => typeof v === "number"),
  partials: Object.values(Partials).filter((v): v is Partials => typeof v === "number"),
  locales: {
    default: Locale.EnglishUS,
    supported: [Locale.PortugueseBR, Locale.SpanishES],
  },
});
