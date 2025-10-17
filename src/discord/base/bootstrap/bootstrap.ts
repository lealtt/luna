import { connectToDatabase } from "#database";
import {
  type StorableCommand,
  cleanupTasks,
  commandRegistry,
  registerClientEvents,
  startTaskRunner,
  registerApplicationCommands,
} from "#discord/modules";
import { setupI18n, logger, env } from "#utils";
import { Client } from "discord.js";
import { Collection } from "discord.js";
import { hookRegistry, emitBotEvent, BotLifecycle } from "../hooks/hooks.modules.js";
import { paginatorState } from "../modules/paginator/paginator.state.js";
import { type BootstrapOptions } from "./bootstrap.types.js";
import { validateOptions } from "./bootstrap.helpers.js";
import { loadAllModules } from "./bootstrap.loader.js";
import { localeState } from "../modules/locale/locale.state.js";

export async function lunaBootstrap(options: BootstrapOptions): Promise<void> {
  let client: Client | undefined;

  process.on("SIGINT", () => shutdown(client));
  process.on("SIGTERM", () => shutdown(client));

  try {
    await emitBotEvent(BotLifecycle.BeforeInit, client!, "initialization");

    const { intents, partials, guilds, locales } = validateOptions(options);

    await emitBotEvent(BotLifecycle.BeforeDbConnect, client!, "database");
    await connectToDatabase();
    await emitBotEvent(BotLifecycle.AfterDbConnect, client!, "database");

    await setupI18n(locales.default, ...locales.supported);

    client = new Client({ intents, partials });
    client.commands = new Collection<string, StorableCommand>();

    cleanupTasks(client);

    await emitBotEvent(BotLifecycle.BeforeModulesLoad, client, "modules");
    await loadAllModules(process.cwd(), import.meta.url.includes("/dist/"));
    await emitBotEvent(BotLifecycle.AfterModulesLoad, client, "modules");

    for (const command of commandRegistry.store.values())
      client.commands.set(command.name, command);

    registerClientEvents(client);

    await emitBotEvent(BotLifecycle.BeforeLogin, client, "authentication");
    await client.login(env.BOT_TOKEN);
    await emitBotEvent(BotLifecycle.AfterLogin, client, "authentication");

    logger.info("Successfully logged in to Discord");

    await emitBotEvent(BotLifecycle.BeforeTasksStart, client, "tasks");
    startTaskRunner(client);
    await emitBotEvent(BotLifecycle.AfterTasksStart, client, "tasks");

    await emitBotEvent(BotLifecycle.BeforeCommandsRegister, client, "commands");
    await registerApplicationCommands(client, guilds);
    await emitBotEvent(BotLifecycle.AfterCommandsRegister, client, "commands");

    await emitBotEvent(BotLifecycle.ClientReady, client, "ready");
    await emitBotEvent(BotLifecycle.AfterInit, client, "initialization");

    logger.success("🌙 Luna is ready.");
  } catch (error) {
    await emitBotEvent(BotLifecycle.CriticalError, client!, "error");
    logger.error("A critical error occurred during bot startup:", error);
    await shutdown(client);
  }
}

async function shutdown(client?: Client): Promise<void> {
  logger.warn("Shutting down bot...");

  if (client) {
    await emitBotEvent(BotLifecycle.BeforeShutdown, client, "shutdown");
  }

  paginatorState.destroy();
  localeState.destroy();
  hookRegistry.clearAll();

  if (client?.isReady()) {
    try {
      await client.destroy();
      logger.info("Client disconnected gracefully.");
    } catch (error) {
      logger.error("Error during client destruction:", error);
    }
  }

  if (client) {
    await emitBotEvent(BotLifecycle.AfterShutdown, client, "shutdown");
  }

  process.exit(1);
}
