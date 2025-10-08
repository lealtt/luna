import { createEmbed } from "#discord/creators";
import type { Middleware } from "#discord/middleware";
import { env, logger } from "#utils";
import { TextChannel, inlineCode, chatInputApplicationCommandMention } from "discord.js";

/**
 * A middleware that sends a detailed log message to a specific channel
 * detailing the command, user, server, and channel of an interaction.
 */
export const logInteraction: Middleware = async (interaction, next) => {
  await next();

  if (!env.LOG_CHANNEL_ID) {
    const { user } = interaction;
    logger.info(
      `User ${user.displayName} (${user.id}) triggered command /${interaction.commandName}`,
    );
    return;
  }

  try {
    const {
      user,
      commandName,
      commandId,
      options,
      guild,
      channel: interactionChannel,
    } = interaction;
    const logChannel = await interaction.client.channels.fetch(env.LOG_CHANNEL_ID);

    if (logChannel instanceof TextChannel) {
      const commandOptions =
        options.data
          .map((opt) => `${inlineCode(opt.name)}: ${inlineCode(String(opt.value))}`)
          .join("\n") || "_No options provided_";

      const embed = createEmbed({
        author: {
          name: user.displayName,
          icon_url: user.displayAvatarURL(),
        },
        title: "Interaction Log",
        thumbnail: {
          url: user.displayAvatarURL(),
        },
        description: `Command ${chatInputApplicationCommandMention(commandName, commandId)} executed.`,
        color: "Blue",
        fields: [
          {
            name: "User",
            value: `${user} (${inlineCode(user.id)})`,
            inline: true,
          },
          {
            name: "Guild",
            value: `${guild?.name ?? "Unknown"} (${inlineCode(guild?.id ?? "N/A")})`,
            inline: true,
          },
          {
            name: "Channel",
            value: `${interactionChannel ?? "Unknown"} (${inlineCode(interactionChannel?.id ?? "N/A")})`,
            inline: true,
          },
          {
            name: "Options",
            value: commandOptions,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "Luna Bot Logging System",
        },
      });

      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error("Failed to send interaction log to the specified channel:", error);
  }
};
