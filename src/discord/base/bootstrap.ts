import "#database";
import "#discord/client";

import { Client, Collection, type GatewayIntentBits, type Partials } from "discord.js";
import { type AnyCommand, commandRegistry } from "#discord/registry";
import { env, logger, setupI18n } from "#utils";
import { startTaskRunner } from "#discord/client";
import {
  loadAllModules,
  registerApplicationCommands,
  registerClientEvents,
} from "#discord/loaders";

/**
 * Options for initializing the bot.
 */
interface BootstrapOptions {
  intents: GatewayIntentBits[];
  partials: Partials[];
  baseURL: string;
  guilds?: string[];
  useI18n?: boolean;
}

/**
 * Initializes and starts the Discord bot.
 * This function orchestrates the entire startup sequence.
 */
export async function lunaBootstrap(options: BootstrapOptions) {
  const { intents, partials, baseURL, guilds, useI18n } = options;

  if (useI18n !== false) await setupI18n();

  const client = new Client({ intents, partials });

  client.commands = new Collection<string, AnyCommand>();
  client.cooldowns = new Collection();

  await loadAllModules(baseURL);

  for (const command of commandRegistry.values()) {
    client.commands.set(command.name, command);
  }

  registerClientEvents(client);

  await client.login(env.BOT_TOKEN);

  const scheduledTasks = startTaskRunner(client);
  logger.task(`Scheduled ${scheduledTasks} tasks.`);

  await registerApplicationCommands(client, guilds);

  logger.success("🍃 Luna is ready.");
}
