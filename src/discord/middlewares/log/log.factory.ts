import type { CommandContext, Middleware } from "#discord/base/middleware";
import { sendLogEmbed } from "./log.handler.js";

/**
 * The type for the 'handler' function that extracts the options/arguments string
 * from a specific command context (T).
 */
export type LogOptionsHandler<T extends CommandContext> = (context: T) => string;

/**
 * A factory for creating log middlewares.
 * @param handler The function that extracts the specific details of the command.
 * @returns A complete and typed log middleware.
 */
export function createLogMiddleware<T extends CommandContext>(
  handler: LogOptionsHandler<T>,
): Middleware<T> {
  return async (context, next) => {
    // Proceed to the next middleware or to the command's execution.
    await next();

    // Extract the command name and ID (if applicable).
    const commandName =
      "commandName" in context
        ? context.commandName
        : (context.content.split(/ +/)[0]?.substring(1) ?? "unknown");
    const commandId = "commandId" in context ? context.commandId : undefined;
    const commandType = "commandType" in context ? context.commandType : undefined;

    // Use the provided handler to get the specific details.
    const optionsString = handler(context);

    // Send the log embed.
    await sendLogEmbed(context.client, {
      user: "author" in context ? context.author : context.user,
      guild: context.guild,
      channel: context.channel,
      command: {
        name: commandName,
        id: commandId,
        options: optionsString || "_No options provided_",
        type: commandType,
      },
    });
  };
}
