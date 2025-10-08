import type { Middleware } from "#discord/middleware";
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  type APIApplicationCommandOption,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  type PermissionsString,
  type UserContextMenuCommandInteraction,
} from "discord.js";

// Base interface with clean
interface BaseCommandData {
  name: string;
  defaultMemberPermissions?: PermissionsString[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: InteractionContextType[];
}

// Interface for Chat Input (/) commands, adding description, options, and autocomplete.
interface ChatInputCommandData extends BaseCommandData {
  description: string;
  options?: APIApplicationCommandOption[];
  autocomplete?: (interaction: AutocompleteInteraction) => any | Promise<any>;
  middlewares?: Middleware[];
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
  run: (interaction: InteractionByType<T>) => any | Promise<any>;
};

// Specific types for each command.
export type ChatInputCommand = Command<ApplicationCommandType.ChatInput>;
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
