import {
  registerCommand,
  type ChatInputCommand,
  type MessageContextMenuCommand,
  type UserContextMenuCommand,
  type AnyCommand,
} from "#discord/registry";

/**
 * A simple factory function for creating and registering a new application command.
 * Uses function overloads to provide strong type inference based on the command type.
 * @param options The command configuration, which determines the command's type and properties.
 */
export function createCommand(options: ChatInputCommand): void;
export function createCommand(options: UserContextMenuCommand): void;
export function createCommand(options: MessageContextMenuCommand): void;
export function createCommand(options: AnyCommand) {
  registerCommand(options);
}
