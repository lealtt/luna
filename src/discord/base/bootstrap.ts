import "#database";
import "./client.js";

import { Client, Collection, type GatewayIntentBits, type Partials } from "discord.js";
import {
  commandRegistry,
  registerApplicationCommands,
  registerClientEvents,
  type AnyCommand,
} from "#discord/modules";
import { env, logger, setupI18n } from "#utils";
import { startTaskRunner } from "#discord/handlers";
import { glob } from "glob";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Loads all module groups sequentially.
 */
async function loadAllModules(): Promise<void> {
  const currentFilePath = fileURLToPath(import.meta.url);
  const isProduction = currentFilePath.includes("/dist/");
  const projectRoot = process.cwd();
  const scanDir = isProduction ? "dist" : "src";
  const extension = isProduction ? "js" : "ts";
  const rootPosix = projectRoot.replace(/\\/g, "/");
  const bootstrapFilePath = currentFilePath.replace(/\\/g, "/");

  const modulePatterns = [
    `${rootPosix}/${scanDir}/discord/events/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/tasks/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/components/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/commands/prefix/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/commands/slash/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/commands/context/**/*.${extension}`,
  ];

  for (const pattern of modulePatterns) {
    const files = await glob(pattern, { ignore: [bootstrapFilePath] });
    for (const file of files) await import(pathToFileURL(file).href);
  }
}

/**
 * Options for initializing the bot.
 */
interface BootstrapOptions {
  intents: GatewayIntentBits[];
  partials: Partials[];
  guilds?: string[];
}

/**
 * Initializes and starts the Discord bot.
 * This function orchestrates the entire startup sequence.
 */
export async function lunaBootstrap(options: BootstrapOptions): Promise<void> {
  const { intents, partials, guilds } = options;

  try {
    await setupI18n();

    const client = new Client({ intents, partials });
    client.commands = new Collection<string, AnyCommand>();
    client.cooldowns = new Collection();

    await loadAllModules();

    for (const command of commandRegistry.values()) {
      client.commands.set(command.name, command);
    }

    registerClientEvents(client);

    await client.login(env.BOT_TOKEN);
    logger.info("Successfully logged in to Discord");

    startTaskRunner(client);

    await registerApplicationCommands(client, guilds);

    logger.success("🍃 Luna is ready.");
  } catch (error) {
    logger.error("A critical error occurred during bot startup:", error);
    process.exit(1);
  }
}
