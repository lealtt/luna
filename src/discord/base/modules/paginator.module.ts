import {
  type InteractionReplyOptions,
  ButtonStyle,
  MessageFlags,
  type User,
  type ActionRowBuilder,
  type MessageActionRowComponentBuilder,
  type EmbedBuilder,
} from "discord.js";
import { createRow, createButton } from "#discord/builders";
import { paginatorState } from "#states";
import { t } from "#utils";
import { createComponent, ComponentInteractionType } from "./component.module.js";

/**
 * Defines the shape of a function that formats a paginator page.
 */
export type PaginatorFormatPage<T> = (
  pageItems: T[],
  currentPage: number,
  totalPages: number,
) => EmbedBuilder;

/**
 * A registry to hold the format functions for different paginators.
 */
const paginatorRegistry = new Map<string, PaginatorFormatPage<any>>();

const defaultEmojis = {
  first: "⏪",
  previous: "⬅️",
  home: "🏠",
  next: "➡️",
  last: "⏩",
};

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
 * @param options The options to configure the paginator.
 * @returns An InteractionReplyOptions object ready to be sent.
 */
export function createPaginator<T>(options: PaginatorOptions<T>): InteractionReplyOptions {
  const { paginatorId, items, itemsPerPage, user, formatPage, emojis } = options;

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
  cached: "cached",
  silent: true,
  async run(interaction, { paginatorId, direction, stateId }) {
    const formatPage = paginatorRegistry.get(paginatorId);
    const state = paginatorState.get(stateId);

    if (!formatPage || !state || interaction.user.id !== state.userId) {
      return interaction.reply({
        content: t(interaction.locale, "common_errors.paginator_expired"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { items, itemsPerPage } = state;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let newPage = state.currentPage;

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

    const pageItems = items.slice(newPage * itemsPerPage, (newPage + 1) * itemsPerPage);
    const embed = formatPage(pageItems, newPage + 1, totalPages);
    const components = [createPaginatorButtons(paginatorId, stateId, newPage, totalPages)];

    paginatorState.update(stateId, { ...state, currentPage: newPage });
    await interaction.update({ embeds: [embed], components });
  },
});
