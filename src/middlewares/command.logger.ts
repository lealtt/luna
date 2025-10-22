import { logger } from "#utils";
import type { Middleware, CommandContext } from "#discord/modules";
import { ApplicationCommandType, type Interaction } from "discord.js";

type CommandInteractionContext = Extract<
  CommandContext,
  Interaction & { commandName: string; commandType: ApplicationCommandType }
>;

export const commandLoggerMiddleware: Middleware<CommandInteractionContext> = async (
  interaction,
  next,
) => {
  const commandName = interaction.commandName;
  const user = interaction.user;
  const guildId = interaction.guildId ?? "DM";
  const commandType = ApplicationCommandType[interaction.commandType];

  logger.command(
    `[${commandType}] /${commandName} executed by ${user.tag} (${user.id}) in Guild: ${guildId}`,
  );

  await next();
};
