import "#discord/client";

import {
  Client,
  Collection,
  PermissionsBitField,
  REST,
  Routes,
  ApplicationCommandType,
  type RESTPostAPIApplicationCommandsJSONBody,
  type GatewayIntentBits as GatewayIntentBitsType,
  type Partials as PartialsType,
} from "discord.js";
import path from "node:path";
import { glob } from "glob";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  eventRegistry,
  commandRegistry,
  componentRegistry,
  type AnyCommand,
  prefixCommandRegistry,
} from "#discord/registry";
import { env, logger, getLocalizations, t, type I18nKey } from "#utils";
import { startTaskRunner } from "#discord/client";

/**
 * Options for initializing the bot.
 */
interface BootstrapOptions {
  intents: GatewayIntentBitsType[];
  partials: PartialsType[];
  baseURL: string;
  guilds?: string[];
}

/**
 * Recursively converts object keys from camelCase to snake_case.
 */
function keysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      acc[snakeKey] = keysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

/**
 * Dynamically loads all Discord and task modules.
 */
export async function loadAllModules(baseURL: string): Promise<void> {
  const entryPath = fileURLToPath(baseURL);
  const isProduction = entryPath.includes("/dist/");
  const projectRoot = path.resolve(path.dirname(entryPath), "..");

  const scanDir = isProduction ? "dist" : "src";
  const extension = isProduction ? "js" : "ts";

  const bootstrapFilePath = fileURLToPath(import.meta.url);
  const rootPosix = projectRoot.replace(/\\/g, "/");

  const patterns = [
    `${rootPosix}/${scanDir}/discord/**/*.${extension}`,
    `${rootPosix}/${scanDir}/tasks/**/*.${extension}`,
  ];

  const files = await glob(patterns, {
    ignore: [bootstrapFilePath.replace(/\\/g, "/")],
  });

  await Promise.all(files.map(async (file) => import(pathToFileURL(file).href)));
}

/**
 * Registers application commands with the Discord API, including localizations.
 */
async function registerCommands(client: Client, rest: REST, guilds: string[] | undefined) {
  const clientId = client.user!.id;
  const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const guildCommands = new Map<string, RESTPostAPIApplicationCommandsJSONBody[]>();

  const allGuildIds = new Set<string>(client.guilds.cache.map((g) => g.id));
  if (guilds) guilds.forEach((id) => allGuildIds.add(id));

  for (const rawCommand of commandRegistry.values()) {
    const command = keysToSnakeCase(rawCommand) as any;

    rawCommand.guilds?.forEach((id: string) => allGuildIds.add(id));

    const baseData = {
      name: command.name,
      nsfw: command.nsfw,
      contexts: command.contexts,
      integration_types: command.integration_types,
      default_member_permissions: command.default_member_permissions
        ? String(PermissionsBitField.resolve(command.default_member_permissions))
        : null,
    };

    let apiData: RESTPostAPIApplicationCommandsJSONBody;

    if (command.type === ApplicationCommandType.ChatInput) {
      const descriptionKey = `commands.${command.name}.description` as I18nKey;

      const localizedOptions = command.options?.map((option: any) => {
        if (!("description" in option)) return option;

        const optionKey = `commands.${command.name}.options.${option.name}.description` as I18nKey;
        return {
          ...option,
          description: t("en-US", optionKey),
          description_localizations: getLocalizations(optionKey),
        };
      });

      apiData = {
        ...baseData,
        type: ApplicationCommandType.ChatInput,
        description: t("en-US", descriptionKey),
        description_localizations: getLocalizations(descriptionKey),
        options: localizedOptions,
      };
    } else {
      apiData = { ...baseData, type: command.type };
    }

    const targetGuilds = rawCommand.guilds ?? guilds;
    if (targetGuilds?.length) {
      const uniqueGuildIds = new Set(targetGuilds);
      for (const guildId of uniqueGuildIds) {
        const list = guildCommands.get(guildId) ?? [];
        list.push(apiData);
        guildCommands.set(guildId, list);
      }
    } else {
      globalCommands.push(apiData);
    }
  }

  logger.api(`Refreshing ${globalCommands.length} global (/) commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body: globalCommands });

  for (const guildId of allGuildIds) {
    const commandsForGuild = guildCommands.get(guildId) ?? [];
    if (commandsForGuild.length > 0) {
      logger.api(`Refreshing ${commandsForGuild.length} commands for guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsForGuild,
      });
    }
  }
}

/**
 * Initializes and starts the Discord bot.
 */
export async function lunaBootstrap(options: BootstrapOptions) {
  const client = new Client({
    intents: options.intents,
    partials: options.partials,
  });

  client.commands = new Collection<string, AnyCommand>();
  client.cooldowns = new Collection();

  await loadAllModules(options.baseURL);

  // Register commands to the client
  for (const command of commandRegistry.values()) {
    client.commands.set(command.name, command);
  }

  // Register events to the client
  for (const event of eventRegistry.values()) {
    const handler = (...args: unknown[]) => event.run(...(args as []));
    client[event.once ? "once" : "on"](event.name, handler);
  }

  const uniquePrefixCommands = new Set(prefixCommandRegistry.values()).size;

  // Log a clean summary of loaded modules
  logger.command(`Loaded ${uniquePrefixCommands} (?) prefix commands.`);
  logger.command(`Loaded ${commandRegistry.size} (/) slash commands.`);
  logger.event(`Loaded ${eventRegistry.size} events.`);
  logger.component(`Loaded ${componentRegistry.size} components.`);

  await client.login(env.BOT_TOKEN);

  const scheduledTasks = startTaskRunner(client);
  logger.task(`Scheduled ${scheduledTasks} tasks.`);

  const rest = new REST().setToken(env.BOT_TOKEN);
  try {
    await registerCommands(client, rest, options.guilds);
  } catch (error) {
    logger.error("Failed to register commands with Discord API:", error);
  }

  logger.success("🍃 Luna is ready.");
}
