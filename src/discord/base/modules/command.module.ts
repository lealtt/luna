import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ChannelType,
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
  type ChatInputCommandInteraction,
  type Client,
  type MessageContextMenuCommandInteraction,
  type PermissionsString,
  type RESTPostAPIApplicationCommandsJSONBody,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { z } from "zod";
import type { Middleware } from "./middleware.module.js";
import { env, getLocalizations, logger, t, type I18nKey } from "#utils";

// Zod schema for validating command names according to Discord's rules (1-32 chars, lowercase, specific characters).
const CommandNameSchema = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9_-]+$/, {
    message:
      "Command names must be lowercase and contain only letters, numbers, hyphens, and underscores.",
  });

// Zod schema for permissions, derived from Discord.js PermissionsBitField.Flags.
const PermissionsEnum = z.enum(
  Object.keys(PermissionsBitField.Flags) as [PermissionsString, ...PermissionsString[]],
);

// Base schema for all application commands, defining common properties.
const BaseCommandSchema = z.object({
  type: z.enum(ApplicationCommandType),
  guilds: z.array(z.string()).optional(),
  cooldown: z.number().int().min(0).optional(),
  middlewares: z.array(z.function()).optional(),
  defaultMemberPermissions: z.array(z.union([PermissionsEnum, z.bigint()])).optional(),
  nsfw: z.boolean().optional(),
  integrationTypes: z.array(z.enum(ApplicationIntegrationType)).optional(),
  contexts: z.array(z.enum(InteractionContextType)).optional(),
  run: z.function(),
});

// Schema for Chat Input (slash) commands, extending the base schema.
const ChatInputCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.ChatInput),
  name: CommandNameSchema,
  description: z.string().min(1).max(100),
  options: z.array(z.any()).optional(),
});

// Schema for User Context Menu commands.
const UserContextMenuCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.User),
  name: z.string().min(1).max(32),
});

// Schema for Message Context Menu commands.
const MessageContextMenuCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.Message),
  name: z.string().min(1).max(32),
});

// Union schema for validating any command type.
const AnyCommandSchema = z.union([
  ChatInputCommandSchema,
  UserContextMenuCommandSchema,
  MessageContextMenuCommandSchema,
]);

// Type guard to check if contexts are strictly Guild-only.
type IsStrictlyGuildOnly<T extends readonly InteractionContextType[] | undefined> =
  T extends readonly [InteractionContextType.Guild] ? true : false;

// Resolves the correct interaction type based on command type and contexts.
type InteractionByType<
  T extends ApplicationCommandType,
  TContexts extends readonly InteractionContextType[] | undefined,
> = T extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction<IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw">
  : T extends ApplicationCommandType.User
    ? UserContextMenuCommandInteraction<
        IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
      >
    : T extends ApplicationCommandType.Message
      ? MessageContextMenuCommandInteraction<
          IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
        >
      : never;

// Defines the shape of an autocomplete handler function, matching the command's context.
type AutocompleteHandler<TContexts extends readonly InteractionContextType[] | undefined> = (
  interaction: AutocompleteInteraction<
    IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
  >,
) => any | Promise<any>;

type ForbiddenLocalizationFields = "name_localizations" | "description_localizations";

// Converts camelCase keys to snake_case for API compatibility (e.g., minValue to min_value).
type CamelCase<T> = {
  [K in keyof T as K extends `${infer Prefix}_length`
    ? `${Prefix}Length`
    : K extends `${infer Prefix}_value`
      ? `${Prefix}Value`
      : K]: T[K];
};

// Option types with `onAutocomplete` for String, Integer, and Number options only.
type StringOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandStringOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
type IntegerOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandIntegerOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
type NumberOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandNumberOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
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

type BasicCommandOption<TContexts extends readonly InteractionContextType[] | undefined> =
  | StringOption<TContexts>
  | IntegerOption<TContexts>
  | NumberOption<TContexts>
  | BooleanOption
  | UserOption
  | ChannelOption
  | RoleOption
  | MentionableOption
  | AttachmentOption;

type SubcommandOption<TContexts extends readonly InteractionContextType[] | undefined> = Omit<
  APIApplicationCommandSubcommandOption,
  ForbiddenLocalizationFields | "options"
> & { options?: BasicCommandOption<TContexts>[] };

type SubcommandGroupOption<TContexts extends readonly InteractionContextType[] | undefined> = Omit<
  APIApplicationCommandSubcommandGroupOption,
  ForbiddenLocalizationFields | "options"
> & { options?: SubcommandOption<TContexts>[] };

// Union type for all valid command options.
export type CommandOption<
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BasicCommandOption<TContexts> | SubcommandOption<TContexts> | SubcommandGroupOption<TContexts>;

// Base interface for all commands, generic over type and contexts.
interface BaseCommand<
  T extends ApplicationCommandType,
  TContexts extends readonly InteractionContextType[] | undefined,
> {
  type: T;
  guilds?: string[];
  cooldown?: number;
  middlewares?: Middleware<InteractionByType<T, TContexts>>[];
  defaultMemberPermissions?: (PermissionsString | bigint)[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: TContexts;
  run: (interaction: InteractionByType<T, TContexts>) => any | Promise<any>;
}

// Chat Input (slash) command structure.
export type ChatInputCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.ChatInput, TContexts> & {
  name: TName;
  description: string;
  options?: CommandOption<TContexts>[];
};

// User Context Menu command structure.
export type UserContextMenuCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.User, TContexts> & {
  name: TName;
};

// Message Context Menu command structure.
export type MessageContextMenuCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.Message, TContexts> & {
  name: TName;
};

// Union of all command types.
export type AnyCommand = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;

// Stores all registered commands.
export const commandRegistry = new Map<string, AnyCommand>();

// Stores autocomplete handlers, indexed by command name and option name.
export const autocompleteRegistry = new Map<string, Map<string, AutocompleteHandler<any>>>();

// Recursively collects autocomplete handlers from a command's options.
function findAutocompleteHandlers<TContexts extends readonly InteractionContextType[] | undefined>(
  options: CommandOption<TContexts>[],
  handlers: Map<string, AutocompleteHandler<TContexts>>,
) {
  for (const option of options) {
    if ("onAutocomplete" in option && typeof option.onAutocomplete === "function") {
      handlers.set(option.name, option.onAutocomplete);
    }
    if (
      (option.type === ApplicationCommandOptionType.Subcommand ||
        option.type === ApplicationCommandOptionType.SubcommandGroup) &&
      option.options
    ) {
      findAutocompleteHandlers(option.options, handlers);
    }
  }
}

// Registers a command after validation and collects autocomplete handlers.
function registerCommand(command: AnyCommand): void {
  const result = AnyCommandSchema.safeParse(command);
  if (!result.success) {
    logger.error(`Invalid command configuration for "${command.name}":`, result.error.flatten());
    throw new Error(`Failed to register command "${command.name}"`);
  }

  if (command.type === ApplicationCommandType.ChatInput && command.options) {
    const handlers = new Map<string, AutocompleteHandler<typeof command.contexts>>();
    findAutocompleteHandlers(command.options, handlers);
    if (handlers.size > 0) {
      autocompleteRegistry.set(command.name, handlers);
    }
  }

  if (commandRegistry.has(command.name)) {
    logger.warn(`Command name "${command.name}" is already registered. Overwriting.`);
  }

  commandRegistry.set(command.name, command);
  logger.module(`Registered command: /${command.name} (${ApplicationCommandType[command.type]})`);
}

// Type-safe factory for creating and registering commands.
export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: ChatInputCommand<TName, TContexts>): void;
export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: UserContextMenuCommand<TName, TContexts>): void;
export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: MessageContextMenuCommand<TName, TContexts>): void;
export function createCommand(options: AnyCommand): void {
  registerCommand(options);
}

// Converts object keys from camelCase to snake_case for Discord API compatibility.
function keysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        keysToSnakeCase(value),
      ]),
    );
  }
  return obj;
}

// Generates localized command options, omitting `onAutocomplete` for API compatibility.
function localizeCommandOptions(basePath: string, options: CommandOption[]): any[] {
  return options.map((option) => {
    const apiOption: Partial<typeof option> = { ...option };
    if ("onAutocomplete" in apiOption) {
      delete (apiOption as any).onAutocomplete;
    }

    const optionNameKey = `${basePath}.options.${apiOption.name}.name` as I18nKey;
    const optionDescriptionKey = `${basePath}.options.${apiOption.name}.description` as I18nKey;

    const translatedOptionName = t("en-US", optionNameKey);
    const finalOptionName =
      translatedOptionName === optionNameKey ? apiOption.name : translatedOptionName;

    let finalOptionDescription: string | undefined;
    if ("description" in apiOption) {
      const translatedOptionDesc = t("en-US", optionDescriptionKey);
      finalOptionDescription =
        translatedOptionDesc === optionDescriptionKey
          ? apiOption.description
          : translatedOptionDesc;
    }

    let localizedSubOptions: any[] | undefined;
    if (
      (apiOption.type === ApplicationCommandOptionType.Subcommand ||
        apiOption.type === ApplicationCommandOptionType.SubcommandGroup) &&
      apiOption.options
    ) {
      const newBasePath = `${basePath}.options.${apiOption.name}`;
      localizedSubOptions = localizeCommandOptions(
        newBasePath,
        apiOption.options as CommandOption[],
      );
    }

    return {
      ...keysToSnakeCase(apiOption),
      name: finalOptionName,
      name_localizations: getLocalizations(optionNameKey),
      description: finalOptionDescription,
      description_localizations: getLocalizations(optionDescriptionKey),
      options: localizedSubOptions,
    };
  });
}

// Registers all commands with the Discord API.
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
