import { createCommand, createEmbed } from "#discord/creators";
import { logMessageContext } from "#discord/middlewares";
import { logger, t } from "#utils";
import { ApplicationCommandType, MessageFlags } from "discord.js";

createCommand({
  name: "Bookmark Message",
  type: ApplicationCommandType.Message,
  middlewares: [logMessageContext],
  async run(interaction) {
    const { locale } = interaction;
    const targetMessage = interaction.targetMessage;

    const embed = createEmbed({
      author: {
        name: `From: ${targetMessage.author.displayName}`,
        icon_url: targetMessage.author.displayAvatarURL(),
      },
      description: targetMessage.content || t(locale, "bookmark.embed_no_content"),
      fields: [
        {
          name: t(locale, "bookmark.embed_original_message"),
          value: `[${t(locale, "bookmark.embed_jump_link")}](${targetMessage.url})`,
        },
      ],
      timestamp: targetMessage.createdAt.toISOString(),
      color: "Green",
      footer: {
        text: `Bookmarked from #${(targetMessage.channel as any)?.name}`,
      },
    });

    try {
      await interaction.user.send({ embeds: [embed] });

      await interaction.reply({
        content: t(locale, "bookmark.dm_success"),
        flags: [MessageFlags.Ephemeral],
      });
    } catch (error) {
      logger.error("Failed to send DM:", error);
      await interaction.reply({
        content: t(locale, "bookmark.dm_error"),
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
});
