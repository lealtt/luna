import type { Middleware } from "#discord/base/middleware";
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
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
  type MessageContextMenuCommandInteraction,
  type PermissionsString,
  type UserContextMenuCommandInteraction,
} from "discord.js";

type InvalidChatCommandChar =
  | " "
  | "-"
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
  | "Z"
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "!"
  | "@"
  | "#"
  | "$"
  | "%"
  | "^"
  | "&"
  | "*"
  | "("
  | ")"
  | "+"
  | "="
  | "{"
  | "}"
  | "["
  | "]"
  | "|"
  | "\\"
  | ":"
  | ";"
  | '"'
  | "'"
  | "<"
  | ">"
  | ","
  | "."
  | "?"
  | "/";

type ValidateChatCommandName<T extends string> =
  T extends `${string}${InvalidChatCommandChar}${string}`
    ? "Chat command names can only contain lowercase letters and hyphens."
    : T;

type ForbiddenLocalizationFields = "name_localizations" | "description_localizations";

// Redefine each option type to use camelCase and forbid localizations.
type StringOption = Omit<
  APIApplicationCommandStringOption,
  ForbiddenLocalizationFields | "min_length" | "max_length"
> & { minLength?: number; maxLength?: number };

type IntegerOption = Omit<
  APIApplicationCommandIntegerOption,
  ForbiddenLocalizationFields | "min_value" | "max_value"
> & { minValue?: number; maxValue?: number };

type NumberOption = Omit<
  APIApplicationCommandNumberOption,
  ForbiddenLocalizationFields | "min_value" | "max_value"
> & { minValue?: number; maxValue?: number };

type BooleanOption = Omit<APIApplicationCommandBooleanOption, ForbiddenLocalizationFields>;
type UserOption = Omit<APIApplicationCommandUserOption, ForbiddenLocalizationFields>;
type ChannelOption = Omit<
  APIApplicationCommandChannelOption,
  ForbiddenLocalizationFields | "channel_types"
> & { channelTypes?: ChannelType[] };

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
> & { options?: BasicCommandOption[] };

type SubcommandGroupOption = Omit<
  APIApplicationCommandSubcommandGroupOption,
  ForbiddenLocalizationFields | "options"
> & { options?: SubcommandOption[] };

export type CommandOption = BasicCommandOption | SubcommandOption | SubcommandGroupOption;

// Base interface with clean, camelCase properties
interface BaseCommandData {
  name: string;
  defaultMemberPermissions?: (PermissionsString | bigint)[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: InteractionContextType[];
}

// Interface for Chat Input (/) commands
interface ChatInputCommandData extends BaseCommandData {
  description: string;
  options?: CommandOption[];
  autocomplete?: (interaction: AutocompleteInteraction) => any | Promise<any>;
}

// Maps our command type to the corresponding data interface.
type CommandData<T extends ApplicationCommandType> = T extends ApplicationCommandType.ChatInput
  ? ChatInputCommandData
  : BaseCommandData;

// Maps the command type to the correct interaction type.
type InteractionByType<T extends ApplicationCommandType> =
  T extends ApplicationCommandType.ChatInput
    ? ChatInputCommandInteraction
    : T extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction
      : T extends ApplicationCommandType.Message
        ? MessageContextMenuCommandInteraction
        : never;

// The Command type is a combination of our clean interface and custom properties.
export type Command<T extends ApplicationCommandType> = CommandData<T> & {
  type: T;
  guilds?: string[];
  cooldown?: number;
  middlewares?: Middleware<InteractionByType<T>>[];
  run: (interaction: InteractionByType<T>) => any | Promise<any>;
};

// Specific types for each command.
export type ChatInputCommand<TName extends string = string> =
  Command<ApplicationCommandType.ChatInput> & {
    name: ValidateChatCommandName<TName>;
  };
export type UserContextMenuCommand = Command<ApplicationCommandType.User>;
export type MessageContextMenuCommand = Command<ApplicationCommandType.Message>;

// A union type representing any command.
export type AnyCommand = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;

/** Command registry */
export const commandRegistry = new Map<string, AnyCommand>();

/** Register a command */
export function registerCommand(command: AnyCommand) {
  commandRegistry.set(command.name, command);
}
