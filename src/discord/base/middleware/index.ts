import type {
  ChatInputCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";

/**
 * A union type representing any possible context in which a command can be executed.
 */
export type CommandContext =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | Message;

/**
 * A function to be called to pass control to the next middleware function.
 */
export type NextFunction = () => Promise<void>;

/**
 * Represents a generic middleware function that can operate on any command context.
 * @template T The specific context type for this middleware.
 */
export type Middleware<T extends CommandContext = CommandContext> = (
  context: T,
  next: NextFunction,
) => Promise<void>;

export * from "./runner.js";
