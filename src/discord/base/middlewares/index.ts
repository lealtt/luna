import type { ChatInputCommandInteraction } from "discord.js";

/**
 * A function to be called to pass control to the next middleware function.
 */
export type NextFunction = () => Promise<void>;

/**
 * Represents a middleware function that is executed before a command's run logic.
 * @param interaction The interaction that triggered the command.
 * @param next A function to pass control to the next middleware in the chain.
 */
export type Middleware = (
  interaction: ChatInputCommandInteraction,
  next: NextFunction,
) => Promise<void>;

export * from "./log.interactions.js";
