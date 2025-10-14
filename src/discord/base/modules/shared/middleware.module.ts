import type {
  ChatInputCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js";

export type CommandContext =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction
  | Message;

export type NextFunction = () => Promise<void>;

export type Middleware<T extends CommandContext = CommandContext> = (
  context: T,
  next: NextFunction,
) => Promise<void>;

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
