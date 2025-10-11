import { createEmbed } from "#discord/builders";
import { createCommand, createPaginator } from "#discord/creators";
import { t } from "#utils";
import {
  ApplicationCommandType,
  InteractionContextType,
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
  description: "Displays a paginated list of items.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  run(interaction) {
    const { locale } = interaction;
    const mockUsers = Array.from({ length: 25 }, (_, i) => `User ${i + 1}`);

    // Using the paginator.
    const replyOptions = createPaginator({
      paginatorId: "userList",
      items: mockUsers,
      itemsPerPage: 5,
      user: interaction.user,
      formatPage: (pageItems, currentPage, totalPages) =>
        formatUserListPage(locale, pageItems, currentPage, totalPages),
    });

    interaction.reply(replyOptions);
  },
});
