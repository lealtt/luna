import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  PermissionsBitField,
  REST,
  Routes,
  type APIApplicationCommandAttachmentOption,
  type APIApplicationCommandBooleanOption,
  type APIApplicationCommandChannelOption,
  type APIApplicationCommandIntegerOption,
  type APIApplicationCommandMentionableOption,
  type APIApplicationCommandNumberOption,
  type APIApplicationCommandRoleOption,
  type APIApplicationCommandStringOption,
  type APIApplicationCommandSubcommandGroupOption,
  type APIApplicationCommandSubcommandOption,
  type APIApplicationCommandUserOption,
  type AutocompleteInteraction,
  type ChannelType,
  type ChatInputCommandInteraction,
  type Client,
  type MessageContextMenuCommandInteraction,
  type PermissionsString,
  type RESTPostAPIApplicationCommandsJSONBody,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import type { Middleware } from "./middleware.module.js";
import { env, getLocalizations, logger, t, type I18nKey } from "#utils";

// Types and Interfaces
type ForbiddenLocalizationFields = "name_localizations" | "description_localizations";

type CamelCase<T> = {
  [K in keyof T as K extends `${infer Prefix}_length`
    ? `${Prefix}Length`
    : K extends `${infer Prefix}_value`
      ? `${Prefix}Value`
      : K]: T[K];
};

type StringOption = CamelCase<Omit<APIApplicationCommandStringOption, ForbiddenLocalizationFields>>;
type IntegerOption = CamelCase<
  Omit<APIApplicationCommandIntegerOption, ForbiddenLocalizationFields>
>;
type NumberOption = CamelCase<Omit<APIApplicationCommandNumberOption, ForbiddenLocalizationFields>>;
type BooleanOption = Omit<APIApplicationCommandBooleanOption, ForbiddenLocalizationFields>;
type UserOption = Omit<APIApplicationCommandUserOption, ForbiddenLocalizationFields>;
type ChannelOption = Omit<
  APIApplicationCommandChannelOption,
  ForbiddenLocalizationFields | "channel_types"
> & {
  channelTypes?: ChannelType[];
};
type RoleOption = Omit<APIApplicationCommandRoleOption, ForbiddenLocalizationFields>;
type MentionableOption = Omit<APIApplicationCommandMentionableOption, ForbiddenLocalizationFields>;
type AttachmentOption = Omit<APIApplicationCommandAttachmentOption, ForbiddenLocalizationFields>;

type BasicCommandOption =
  | StringOption
  | IntegerOption
  | NumberOption
  | BooleanOption
  | UserOption
  | ChannelOption
  | RoleOption
  | MentionableOption
  | AttachmentOption;

type SubcommandOption = Omit<
  APIApplicationCommandSubcommandOption,
  ForbiddenLocalizationFields | "options"
> & {
  options?: BasicCommandOption[];
};

type SubcommandGroupOption = Omit<
  APIApplicationCommandSubcommandGroupOption,
  ForbiddenLocalizationFields | "options"
> & {
  options?: SubcommandOption[];
};

export type CommandOption = BasicCommandOption | SubcommandOption | SubcommandGroupOption;

type InteractionByType<T extends ApplicationCommandType> =
  T extends ApplicationCommandType.ChatInput
    ? ChatInputCommandInteraction<"cached">
    : T extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction<"cached">
      : T extends ApplicationCommandType.Message
        ? MessageContextMenuCommandInteraction<"cached">
        : never;

interface BaseCommand<T extends ApplicationCommandType> {
  type: T;
  guilds?: string[];
  cooldown?: number;
  middlewares?: Middleware<InteractionByType<T>>[];
  defaultMemberPermissions?: (PermissionsString | bigint)[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: InteractionContextType[];
  run: (interaction: InteractionByType<T>) => any | Promise<any>;
}

export type ChatInputCommand<TName extends string = string> =
  BaseCommand<ApplicationCommandType.ChatInput> & {
    name: ValidateChatCommandName<TName>;
    description: string;
    options?: CommandOption[];
    autocomplete?: (interaction: AutocompleteInteraction<"cached">) => any | Promise<any>;
  };

export type UserContextMenuCommand<TName extends string = string> =
  BaseCommand<ApplicationCommandType.User> & {
    name: TName;
  };

export type MessageContextMenuCommand<TName extends string = string> =
  BaseCommand<ApplicationCommandType.Message> & {
    name: TName;
  };

export type AnyCommand = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;

type InvalidChatCommandChar =
  | " "
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";
type ValidateChatCommandName<T extends string> =
  T extends `${string}${InvalidChatCommandChar}${string}`
    ? "Chat command names can only contain lowercase letters and hyphens."
    : T;

export const commandRegistry = new Map<string, AnyCommand>();

/**
 * Registers a command in the registry with runtime validation.
 * @param command The command to register.
 */
function registerCommand(command: AnyCommand): void {
  if (command.type === ApplicationCommandType.ChatInput) {
    const validNameRegex = /^[a-z0-9_-]{1,32}$/;
    if (!validNameRegex.test(command.name) || command.name.toUpperCase() === command.name) {
      logger.warn(
        `Invalid chat command name "${command.name}". Chat command names must be all lowercase and can only contain letters, numbers, hyphens, and underscores.`,
      );
    }
  }

  if (commandRegistry.has(command.name)) {
    logger.warn(`Command name "${command.name}" is already registered. Overwriting.`);
  }

  commandRegistry.set(command.name, command);
  logger.module(`Registered command: /${command.name} (${ApplicationCommandType[command.type]})`);
}

/**
 * Factory function for creating and registering a new application command.
 * @param options The command configuration.
 */
export function createCommand<const TName extends string>(options: ChatInputCommand<TName>): void;
export function createCommand<const TName extends string>(
  options: UserContextMenuCommand<TName>,
): void;
export function createCommand<const TName extends string>(
  options: MessageContextMenuCommand<TName>,
): void;
export function createCommand(options: AnyCommand) {
  registerCommand(options);
}

//API Registration
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
 * Registers all application commands with the Discord API, clearing old commands.
 * @param client The Discord client instance.
 * @param guilds An optional array of guild IDs for development.
 */
export async function registerApplicationCommands(
  client: Client,
  guilds?: string[],
): Promise<void> {
  const rest = new REST().setToken(env.BOT_TOKEN);
  const clientId = client.user!.id;

  const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const guildCommands = new Map<string, RESTPostAPIApplicationCommandsJSONBody[]>();
  const allGuildIds = new Set<string>(client.guilds.cache.map((g) => g.id));
  if (guilds) guilds.forEach((id) => allGuildIds.add(id));

  for (const command of commandRegistry.values()) {
    let apiData: RESTPostAPIApplicationCommandsJSONBody;
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
      targetGuilds.forEach((guildId) => allGuildIds.add(guildId));
      for (const guildId of new Set(targetGuilds)) {
        const list = guildCommands.get(guildId) ?? [];
        list.push(apiData);
        guildCommands.set(guildId, list);
      }
    } else {
      globalCommands.push(apiData);
    }
  }

  try {
    logger.api(`Refreshing ${globalCommands.length} global (/) commands...`);
    await rest.put(Routes.applicationCommands(clientId), { body: globalCommands });

    for (const guildId of allGuildIds) {
      const commandsToDeploy = guildCommands.get(guildId) ?? [];
      logger.api(`Refreshing ${commandsToDeploy.length} commands for guild ${guildId}...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandsToDeploy,
      });
    }

    logger.command(`Loaded ${commandRegistry.size} (/) slash commands.`);
  } catch (error) {
    logger.error("Failed to register commands with Discord API:", error);
    throw error;
  }
}
