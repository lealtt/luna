import { createEmbed } from "#discord/builders";
import { env, logger } from "#utils";
import {
  type Client,
  type User,
  type Guild,
  type TextBasedChannel,
  TextChannel,
  inlineCode,
  chatInputApplicationCommandMention,
  ApplicationCommandType,
} from "discord.js";

// Options for the audit embed
interface AuditEmbedOptions {
  user: User;
  guild: Guild | null;
  channel: TextBasedChannel | null;
  command: {
    name: string;
    id?: string;
    options?: string;
    type?: ApplicationCommandType;
  };
}

/**
 * Creates and sends a standardized audit embed to the configured log channel.
 * @param client The Discord client instance.
 * @param options The data to include in the audit embed.
 */
export async function sendAuditEmbed(client: Client, options: AuditEmbedOptions) {
  if (!env.LOG_CHANNEL_ID) return;

  try {
    const { user, guild, channel: interactionChannel, command } = options;
    const logChannel = await client.channels.fetch(env.LOG_CHANNEL_ID);

    if (logChannel instanceof TextChannel) {
      const commandMentionFormatters: Partial<Record<ApplicationCommandType, () => string>> = {
        [ApplicationCommandType.ChatInput]: () =>
          chatInputApplicationCommandMention(command.name, command.id!),
        [ApplicationCommandType.User]: () => inlineCode(command.name),
        [ApplicationCommandType.Message]: () => inlineCode(command.name),
      };

      const formatter = command.type ? commandMentionFormatters[command.type] : undefined;
      const commandMention = formatter ? formatter() : `?${command.name}`;

      const embed = createEmbed({
        author: { name: user.displayName, iconUrl: user.displayAvatarURL() },
        title: "Command Audit Log",
        description: `Command ${commandMention} executed.`,
        color: "Blue",
        fields: [
          { name: "User", value: `${user} (${inlineCode(user.id)})`, inline: true },
          {
            name: "Guild",
            value: `${guild?.name ?? "DM"} (${inlineCode(guild?.id ?? "N/A")})`,
            inline: true,
          },
          {
            name: "Channel",
            value: `${interactionChannel ?? "Unknown"} (${inlineCode(interactionChannel?.id ?? "N/A")})`,
            inline: true,
          },
          { name: "Options / Arguments", value: command.options || "_No options provided_" },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Luna Bot Logging System" },
      });

      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error("Failed to send audit embed:", error);
  }
}
