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
  type ChatInputCommand,
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
 * Dynamically loads all Discord and task modules.
 *
 * @param baseURL The base URL from which to resolve the project root, typically `import.meta.url`.
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
    command.guilds?.forEach((id) => allGuildIds.add(id));

    const baseData = {
      name: command.name,
      nsfw: command.nsfw,
      contexts: command.contexts,
      integration_types: command.integrationTypes,
      default_member_permissions: command.defaultMemberPermissions
        ? String(PermissionsBitField.resolve(command.defaultMemberPermissions))
        : null,
    };

    let apiData: RESTPostAPIApplicationCommandsJSONBody;

    if (command.type === ApplicationCommandType.ChatInput) {
      const chatInput = command as ChatInputCommand;
      const descriptionKey = `commands.${chatInput.name}.description` as I18nKey;

      const localizedOptions = chatInput.options?.map((option) => {
        if (!("description" in option)) return option;

        const optionKey =
          `commands.${chatInput.name}.options.${option.name}.description` as I18nKey;
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

    const targetGuilds = command.guilds ?? guilds;
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

  // Log a clean summary of loaded modules
  logger.command(`Loaded ${commandRegistry.size} commands.`);
  logger.event(`Loaded ${eventRegistry.size} events.`);
  logger.component(`Loaded ${componentRegistry.size} components.`);

  await client.login(env.BOT_TOKEN);

  // Start tasks and log a summary
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
