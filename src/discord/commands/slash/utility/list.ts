import { createEmbed } from "#discord/builders";
import { createCommand, createPaginator } from "#discord/creators";
import { t } from "#utils";
import {
  ApplicationCommandType,
  InteractionContextType,
  MessageFlags,
  type EmbedBuilder,
  type Locale,
} from "discord.js";

function formatUserListPage(
  locale: Locale,
  pageItems: string[],
  currentPage: number,
  totalPages: number,
): EmbedBuilder {
  const embed = createEmbed({
    title: t(locale, "list.embed_title"),
    description: pageItems.join("\n"),
    footer: {
      text: t(locale, "list.embed_footer", {
        currentPage,
        totalPages,
      }),
    },
  });

  return embed;
}

createCommand({
  name: "list",
  description: "Displays a paginated list of all server members.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { locale, guild } = interaction;

    if (!guild) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Fetch all members from the server.
    const members = await guild.members.fetch();

    // Map the members to a numbered list of strings.
    const memberList = Array.from(members.values()).map(
      (member, index) => `${index + 1}. ${member.user.tag} (${member.displayName})`,
    );

    // Using the paginator with the real member list.
    const replyOptions = createPaginator({
      paginatorId: "memberList",
      items: memberList,
      itemsPerPage: 10, // Increased for a better view
      user: interaction.user,
      formatPage: (pageItems, currentPage, totalPages) =>
        formatUserListPage(locale, pageItems, currentPage, totalPages),
    });

    await interaction.followUp(replyOptions);
  },
});
