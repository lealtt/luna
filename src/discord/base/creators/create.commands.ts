import {
  registerCommand,
  type ChatInputCommand,
  type MessageContextMenuCommand,
  type UserContextMenuCommand,
  type AnyCommand,
} from "#discord/registry";

/**
 * A simple factory function for creating and registering a new application command.
 * @param options The command configuration, which determines the command's type and properties.
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
