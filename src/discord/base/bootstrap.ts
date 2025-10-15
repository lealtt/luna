import "./client.js";
import { pathToFileURL } from "node:url";
import { resolve, normalize } from "node:path";
import { Client, Collection, GatewayIntentBits, Partials, SnowflakeUtil, Locale } from "discord.js";
import { glob } from "glob";
import { logger, env, setupI18n } from "#utils";
import { commandRegistry, registerApplicationCommands } from "./modules/commands/command.module.js";
import { registerClientEvents } from "./modules/events/events.module.js";
import { startTaskRunner } from "./modules/tasks/task.handler.js";
import type { StorableCommand } from "./modules/commands/command.types.js";
import { connectToDatabase } from "#database";
import { paginatorState } from "#states";

interface BootstrapOptions {
  readonly intents: readonly GatewayIntentBits[];
  readonly partials: readonly Partials[];
  readonly guilds?: readonly string[];
  readonly locales: {
    readonly default: Locale;
    readonly supported: readonly Locale[];
  };
}

const validIntents = Object.values(GatewayIntentBits).filter(
  (v): v is GatewayIntentBits => typeof v === "number",
);
const validPartials = Object.values(Partials).filter((v): v is Partials => typeof v === "number");
const validLocales = Object.values(Locale);

function validateOptions(options: BootstrapOptions): BootstrapOptions {
  const { intents, partials, guilds, locales } = options;

  return {
    intents: intents.filter((intent) => validIntents.includes(intent)),
    partials: partials.filter((partial) => validPartials.includes(partial)),
    guilds: guilds?.filter(isValidSnowflake),
    locales: {
      default: validLocales.includes(locales.default) ? locales.default : Locale.EnglishUS,
      supported: locales.supported.filter((locale) => validLocales.includes(locale)),
    },
  };
}

function isValidSnowflake(id: string): boolean {
  return /^[0-9]{17,20}$/.test(id) && SnowflakeUtil.deconstruct(id).timestamp > 0;
}

function isSafePath(filePath: string, root: string): boolean {
  const resolvedPath = resolve(root, filePath);
  const normalizedRoot = normalize(root);
  return resolvedPath.startsWith(normalizedRoot);
}

async function loadAllModules(projectRoot: string, isProduction: boolean): Promise<void> {
  const scanDir = isProduction ? "dist" : "src";
  const extension = isProduction ? "js" : "ts";
  const rootPosix = projectRoot.replace(/\\/g, "/");

  const modulePatterns = [
    `${rootPosix}/${scanDir}/discord/events/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/tasks/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/components/**/*.${extension}`,
    `${rootPosix}/${scanDir}/discord/commands/**/*.${extension}`,
  ];

  for (const pattern of modulePatterns) {
    const files = await glob(pattern);
    for (const file of files) {
      if (isSafePath(file, projectRoot)) {
        try {
          await import(pathToFileURL(file).href);
        } catch (error) {
          logger.error(`Failed to load module ${file}:`, error);
        }
      } else {
        logger.warn(`Skipping unsafe file path: ${file}`);
      }
    }
  }
}

async function shutdown(client?: Client): Promise<void> {
  logger.warn("Shutting down bot...");

  paginatorState.destroy();

  if (client) {
    if (client.isReady()) {
      try {
        await client.destroy();
        logger.info("Client disconnected gracefully.");
      } catch (error) {
        logger.error("Error during client destruction:", error);
      }
    }
  }

  process.exit(1);
}

export async function lunaBootstrap(options: BootstrapOptions): Promise<void> {
  let client: Client | undefined;

  process.on("SIGINT", () => shutdown(client));
  process.on("SIGTERM", () => shutdown(client));

  try {
    const { intents, partials, guilds, locales } = validateOptions(options);

    await connectToDatabase();
    await setupI18n(locales.default, ...locales.supported);

    client = new Client({ intents, partials });
    client.commands = new Collection<string, StorableCommand>();

    await loadAllModules(process.cwd(), import.meta.url.includes("/dist/"));

    for (const command of commandRegistry.store.values()) {
      client.commands.set(command.name, command);
    }

    registerClientEvents(client);

    await client.login(env.BOT_TOKEN);
    logger.info("Successfully logged in to Discord");

    startTaskRunner(client);
    await registerApplicationCommands(client, guilds);

    logger.success("🍃 Luna is ready.");
    logMemoryStats();
  } catch (error) {
    logger.error("A critical error occurred during bot startup:", error);
    await shutdown(client);
  }
}

function logMemoryStats(): void {
  const paginatorStats = paginatorState.getStats();

  logger.info(`Memory Stats - Paginators: ${paginatorStats.size}/${paginatorStats.maxSize}`);
}
