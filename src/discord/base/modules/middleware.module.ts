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

/**
 * Executes a chain of middlewares and the final command logic for any context.
 * @param context The interaction or message object.
 * @param middlewares The array of middlewares to execute.
 * @param finalHandler The final function to call (the command's run function).
 */
export async function runMiddlewareChain<T extends CommandContext>(
  context: T,
  middlewares: Middleware<T>[],
  finalHandler: () => Promise<void>,
) {
  let index = -1;

  const next: NextFunction = async () => {
    index++;
    if (index < middlewares.length) {
      await middlewares[index](context, next);
    } else {
      await finalHandler();
    }
  };

  await next();
}
