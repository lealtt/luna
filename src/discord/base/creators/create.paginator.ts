import {
  type InteractionReplyOptions,
  ButtonStyle,
  MessageFlags,
  type User,
  type ActionRowBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { createComponent } from "./create.components.js";
import {
  ComponentInteractionType,
  paginatorRegistry,
  type PaginatorFormatPage,
} from "#discord/registry";
import { createRow, createButton } from "./create.builders.js";
import { paginatorState } from "#states";
import { t } from "#utils";

// Default emojis for the navigation buttons.
const defaultEmojis = {
  first: "⏪",
  previous: "⬅️",
  home: "🏠",
  next: "➡️",
  last: "⏩",
};

// Paginator options that will be stored.
interface PaginatorOptions<T> {
  paginatorId: string;
  items: T[];
  itemsPerPage: number;
  user: User;
  formatPage: PaginatorFormatPage<T>;
  emojis?: Partial<typeof defaultEmojis>;
}

/**
 * Creates the navigation buttons for the paginator.
 */
function createPaginatorButtons(
  paginatorId: string,
  stateId: string,
  currentPage: number,
  totalPages: number,
  customEmojis: Partial<typeof defaultEmojis> = {},
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const emojis = { ...defaultEmojis, ...customEmojis };

  return createRow(
    createButton({
      customId: `paginator/${paginatorId}/first/${stateId}`,
      emoji: emojis.first,
      style: ButtonStyle.Secondary,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/${paginatorId}/prev/${stateId}`,
      emoji: emojis.previous,
      style: ButtonStyle.Primary,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/${paginatorId}/home/${stateId}`,
      emoji: emojis.home,
      style: ButtonStyle.Success,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/${paginatorId}/next/${stateId}`,
      emoji: emojis.next,
      style: ButtonStyle.Primary,
      disabled: currentPage >= totalPages - 1,
    }),
    createButton({
      customId: `paginator/${paginatorId}/last/${stateId}`,
      emoji: emojis.last,
      style: ButtonStyle.Secondary,
      disabled: currentPage >= totalPages - 1,
    }),
  );
}

/**
 * Creates a reusable paginator for displaying arrays of data.
 * This function also dynamically registers the component handler.
 * @param options The options to configure the paginator.
 * @returns An InteractionReplyOptions object ready to be sent.
 */
export function createPaginator<T>(options: PaginatorOptions<T>): InteractionReplyOptions {
  const { paginatorId, items, itemsPerPage, user, formatPage, emojis } = options;

  // Store the format function if it doesn't already exist.
  if (!paginatorRegistry.has(paginatorId)) {
    paginatorRegistry.set(paginatorId, formatPage);
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const initialState = {
    items,
    itemsPerPage,
    currentPage: 0,
    userId: user.id,
    paginatorId,
  };

  // Create the initial state and get a unique ID.
  const stateId = paginatorState.set(initialState);
  const initialPageItems = items.slice(0, itemsPerPage);
  const embed = formatPage(initialPageItems, 1, totalPages);
  const components = [createPaginatorButtons(paginatorId, stateId, 0, totalPages, emojis)];

  return { embeds: [embed], components, flags: MessageFlags.Ephemeral };
}

/**
 * Registers a single, generic component handler for all paginators.
 */
createComponent({
  customId: "paginator/{paginatorId}/{direction}/{stateId}",
  type: ComponentInteractionType.Button,
  async run(interaction, { paginatorId, direction, stateId }) {
    const formatPage = paginatorRegistry.get(paginatorId);
    const state = paginatorState.get(stateId);

    // Check if the state is valid and if the interaction belongs to the original user.
    if (!formatPage || !state || interaction.user.id !== state.userId) {
      return interaction.reply({
        content: t(interaction.locale, "common_errors.paginator_expired"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { items, itemsPerPage } = state;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let newPage = state.currentPage;

    // Calculate the new page number based on the direction of the clicked button.
    switch (direction) {
      case "first":
        newPage = 0;
        break;
      case "prev":
        newPage = Math.max(0, state.currentPage - 1);
        break;
      case "home":
        newPage = 0;
        break;
      case "next":
        newPage = Math.min(totalPages - 1, state.currentPage + 1);
        break;
      case "last":
        newPage = totalPages - 1;
        break;
    }

    // Slice the items for the new page and format the embed.
    const pageItems = items.slice(newPage * itemsPerPage, (newPage + 1) * itemsPerPage);
    const embed = formatPage(pageItems, newPage + 1, totalPages);
    const components = [createPaginatorButtons(paginatorId, stateId, newPage, totalPages)];

    // Update the state with the new page and update the original message.
    paginatorState.update(stateId, { ...state, currentPage: newPage });
    await interaction.update({ embeds: [embed], components });
  },
});
