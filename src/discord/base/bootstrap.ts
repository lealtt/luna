import "#database";
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

  for (const command of commandRegistry.values()) {
    command.guilds?.forEach((id: string) => allGuildIds.add(id));

    let apiData: RESTPostAPIApplicationCommandsJSONBody;

    // Base data common to all command types, converted to snake_case
    const baseData = {
      nsfw: command.nsfw,
      contexts: command.contexts,
      integration_types: command.integrationTypes,
      default_member_permissions: command.defaultMemberPermissions
        ? String(PermissionsBitField.resolve(command.defaultMemberPermissions))
        : null,
    };

    // Handle Chat Input Commands
    if (command.type === ApplicationCommandType.ChatInput) {
      const nameKey = `commands.${command.name}.name` as I18nKey;
      const descriptionKey = `commands.${command.name}.description` as I18nKey;

      const translatedName = t("en-US", nameKey);
      const finalName = translatedName === nameKey ? command.name : translatedName;

      const translatedDescription = t("en-US", descriptionKey);
      const finalDescription =
        translatedDescription === descriptionKey ? command.description : translatedDescription;

      const localizedOptions = command.options?.map((option) => {
        const optionNameKey = `commands.${command.name}.options.${option.name}.name` as I18nKey;
        const optionDescriptionKey =
          `commands.${command.name}.options.${option.name}.description` as I18nKey;

        const translatedOptionName = t("en-US", optionNameKey);
        const finalOptionName =
          translatedOptionName === optionNameKey ? option.name : translatedOptionName;

        let finalOptionDescription: string | undefined;
        if ("description" in option) {
          const translatedOptionDesc = t("en-US", optionDescriptionKey);
          finalOptionDescription =
            translatedOptionDesc === optionDescriptionKey
              ? option.description
              : translatedOptionDesc;
        }

        return {
          ...keysToSnakeCase(option),
          name: finalOptionName,
          name_localizations: getLocalizations(optionNameKey),
          description: finalOptionDescription,
          description_localizations: getLocalizations(optionDescriptionKey),
        };
      });

      apiData = {
        ...baseData,
        name: finalName,
        name_localizations: getLocalizations(nameKey),
        description: finalDescription,
        description_localizations: getLocalizations(descriptionKey),
        options: localizedOptions,
        type: ApplicationCommandType.ChatInput,
      };
    } else {
      // Handle Context Menu Commands (User, Message)
      const commandKey = command.name.toLowerCase().replace(/ /g, "-");
      const nameKey = `commands.${commandKey}.name` as I18nKey;

      const translatedName = t("en-US", nameKey);
      const finalName = translatedName === nameKey ? command.name : translatedName;

      apiData = {
        ...baseData,
        name: finalName,
        name_localizations: getLocalizations(nameKey),
        type: command.type,
      };
    }

    // Assign command to global or guild-specific lists
    const targetGuilds = command.guilds ?? guilds;
    if (targetGuilds?.length) {
      for (const guildId of new Set(targetGuilds)) {
        const list = guildCommands.get(guildId) ?? [];
        list.push(apiData);
        guildCommands.set(guildId, list);
      }
    } else {
      globalCommands.push(apiData);
    }
  }

  // Deploy commands to the Discord API
  if (globalCommands.length > 0) {
    logger.api(`Refreshing ${globalCommands.length} global (/) commands...`);
    await rest.put(Routes.applicationCommands(clientId), { body: globalCommands });
  }

  for (const guildId of allGuildIds) {
    const commandsToDeploy = guildCommands.get(guildId) ?? [];
    if (commandsToDeploy.length > 0) {
      logger.api(`Refreshing ${commandsToDeploy.length} commands for guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsToDeploy,
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
