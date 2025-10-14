import "./client.js";
import { pathToFileURL } from "node:url";
import { resolve, normalize } from "node:path";
import { Client, Collection, GatewayIntentBits, Partials, SnowflakeUtil } from "discord.js";
import { glob } from "glob";
import { logger, env, setupI18n } from "#utils";
import { commandRegistry, registerApplicationCommands } from "./modules/commands/command.module.js";
import { registerClientEvents } from "./modules/events/events.module.js";
import { startTaskRunner } from "./modules/tasks/task.handler.js";
import type { StorableCommand } from "./modules/commands/command.types.js";
import { connectToDatabase } from "#database";

/**
 * Defines the options for initializing the bot.
 */
interface BootstrapOptions {
  readonly intents: readonly GatewayIntentBits[];
  readonly partials: readonly Partials[];
  readonly guilds?: readonly string[];
}

const validIntents = Object.values(GatewayIntentBits).filter(
  (v): v is GatewayIntentBits => typeof v === "number",
);
const validPartials = Object.values(Partials).filter((v): v is Partials => typeof v === "number");

/**
 * Validates and filters the bootstrap options to ensure they contain valid values.
 * @param options The initial bootstrap options.
 * @returns Sanitized bootstrap options.
 */
function validateOptions(options: BootstrapOptions): BootstrapOptions {
  const { intents, partials, guilds } = options;

  return {
    intents: intents.filter((intent) => validIntents.includes(intent)),
    partials: partials.filter((partial) => validPartials.includes(partial)),
    guilds: guilds?.filter(isValidSnowflake),
  };
}

/**
 * Checks if a given string is a valid Discord snowflake ID.
 * @param id The string to validate.
 * @returns True if the ID is a valid snowflake.
 */
function isValidSnowflake(id: string): boolean {
  return /^[0-9]{17,20}$/.test(id) && SnowflakeUtil.deconstruct(id).timestamp > 0;
}

/**
 * Checks if a file path is within the project's root directory to prevent path traversal.
 * @param filePath The path to check.
 * @param root The project root directory.
 * @returns True if the path is safe.
 */
function isSafePath(filePath: string, root: string): boolean {
  const resolvedPath = resolve(root, filePath);
  const normalizedRoot = normalize(root);
  return resolvedPath.startsWith(normalizedRoot);
}

/**
 * Dynamically loads all modules (commands, events, etc.) from the project structure.
 * @param projectRoot The root directory of the project.
 * @param isProduction A boolean indicating if the environment is production.
 */
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

/**
 * Gracefully shuts down the client and exits the process.
 * @param client The Discord client instance.
 */
async function shutdown(client?: Client): Promise<void> {
  logger.warn("Shutting down bot...");
  if (client && client.isReady()) {
    try {
      await client.destroy();
      logger.info("Client disconnected gracefully.");
    } catch (error) {
      logger.error("Error during client destruction:", error);
    }
  }
  process.exit(1);
}

/**
 * Initializes and starts the Discord bot.
 * This function orchestrates the entire startup sequence.
 * @param options The options for configuring the bot.
 */
export async function lunaBootstrap(options: BootstrapOptions): Promise<void> {
  let client: Client | undefined;

  try {
    const { intents, partials, guilds } = validateOptions(options);

    await connectToDatabase();
    await setupI18n();

    client = new Client({ intents, partials });
    client.commands = new Collection<string, StorableCommand>();
    client.cooldowns = new Collection<string, Collection<string, number>>();

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
  } catch (error) {
    logger.error("A critical error occurred during bot startup:", error);
    await shutdown(client);
  }
}
