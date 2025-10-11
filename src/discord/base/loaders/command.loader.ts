import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  PermissionsBitField,
  REST,
  Routes,
  type Client,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import { commandRegistry, type CommandOption, prefixCommandRegistry } from "#discord/registry";
import { env, getLocalizations, logger, t, type I18nKey } from "#utils";

/**
 * Recursively converts object keys from camelCase to snake_case.
 * Discord's API expects snake_case for all properties.
 * @param obj The object to convert.
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
 * Recursively localizes command options using the i18n system.
 * @param basePath The base path for the translation key (e.g., "commands.profile").
 * @param options The command options to localize.
 */
function localizeCommandOptions(basePath: string, options: CommandOption[]): any[] {
  return options.map((option) => {
    const optionNameKey = `${basePath}.options.${option.name}.name` as I18nKey;
    const optionDescriptionKey = `${basePath}.options.${option.name}.description` as I18nKey;

    const translatedOptionName = t("en-US", optionNameKey);
    const finalOptionName =
      translatedOptionName === optionNameKey ? option.name : translatedOptionName;

    let finalOptionDescription: string | undefined;
    if ("description" in option) {
      const translatedOptionDesc = t("en-US", optionDescriptionKey);
      finalOptionDescription =
        translatedOptionDesc === optionDescriptionKey ? option.description : translatedOptionDesc;
    }

    let localizedSubOptions: any[] | undefined;
    if (
      option.type === ApplicationCommandOptionType.Subcommand ||
      option.type === ApplicationCommandOptionType.SubcommandGroup
    ) {
      if (option.options) {
        const newBasePath = `${basePath}.options.${option.name}`;
        localizedSubOptions = localizeCommandOptions(
          newBasePath,
          option.options as CommandOption[],
        );
      }
    }

    return {
      ...keysToSnakeCase(option),
      name: finalOptionName,
      name_localizations: getLocalizations(optionNameKey),
      description: finalOptionDescription,
      description_localizations: getLocalizations(optionDescriptionKey),
      options: localizedSubOptions,
    };
  });
}

/**
 * Registers all application commands with the Discord API.
 * This includes handling global and guild-specific commands, as well as localization.
 * @param client The Discord client instance.
 * @param guilds An optional array of guild IDs for development/testing.
 */
export async function registerApplicationCommands(client: Client, guilds?: string[]) {
  const rest = new REST().setToken(env.BOT_TOKEN);
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

    if (command.type === ApplicationCommandType.ChatInput) {
      const nameKey = `commands.${command.name}.name` as I18nKey;
      const descriptionKey = `commands.${command.name}.description` as I18nKey;

      const translatedName = t("en-US", nameKey);
      const finalName = translatedName === nameKey ? command.name : translatedName;

      const translatedDescription = t("en-US", descriptionKey);
      const finalDescription =
        translatedDescription === descriptionKey ? command.description : translatedDescription;

      const localizedOptions = command.options
        ? localizeCommandOptions(`commands.${command.name}`, command.options)
        : undefined;

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
  try {
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
  } catch (error) {
    logger.error("Failed to register commands with Discord API:", error);
  }

  // Log summary of loaded commands
  const uniquePrefixCommands = new Set(prefixCommandRegistry.values()).size;
  logger.command(`Loaded ${uniquePrefixCommands} (?) prefix commands.`);
  logger.command(`Loaded ${commandRegistry.size} (/) slash commands.`);
}
