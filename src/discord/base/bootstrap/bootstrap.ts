import { connectToDatabase } from "#database";
import {
  type StorableCommand,
  cleanupTasks,
  commandRegistry,
  registerClientEvents,
  startTaskRunner,
  registerApplicationCommands,
} from "#discord/modules";
import { logger } from "#utils";
import { Client } from "discord.js";
import { Collection } from "discord.js";
import { type BootstrapOptions } from "./bootstrap.types.js";
import { validateOptions } from "./bootstrap.helpers.js";
import { loadAllModules } from "./bootstrap.loader.js";
import { setNimbusDefaultLocale } from "#translate";
import { env } from "#env";

export async function lunaBootstrap(options: BootstrapOptions): Promise<void> {
  let client: Client | undefined;

  process.on("SIGINT", () => shutdown(client));
  process.on("SIGTERM", () => shutdown(client));

  try {
    const { intents, partials, guilds, locales } = validateOptions(options);

    await connectToDatabase();

    setNimbusDefaultLocale(locales.default);
    logger.info(`Supported locales: ${[locales.default, ...locales.supported].join(", ")}`);

    client = new Client({ intents, partials });
    client.commands = new Collection<string, StorableCommand>();

    cleanupTasks(client);

    await loadAllModules(process.cwd(), import.meta.url.includes("/dist/"));

    for (const command of commandRegistry.store.values())
      client.commands.set(command.name, command);

    registerClientEvents(client);

    await client.login(env.BOT_TOKEN);

    logger.info("Successfully logged in to Discord");

    startTaskRunner(client);

    await registerApplicationCommands(client, guilds);

    logger.success("🌙 Luna is ready.");
  } catch (error) {
    logger.error("A critical error occurred during bot startup:", error);
    await shutdown(client);
  }
}

async function shutdown(client?: Client): Promise<void> {
  logger.warn("Shutting down bot...");

  if (client?.isReady()) {
    try {
      await client.destroy();
      logger.info("Client disconnected gracefully.");
    } catch (error) {
      logger.error("Error during client destruction:", error);
    }
  }

  process.exit(1);
}
