import {
  type InteractionReplyOptions,
  ButtonStyle,
  MessageFlags,
  type ActionRowBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { createRow, createButton } from "#discord/builders";
import { paginatorState } from "#states";
import type { PaginatorOptions, PaginatorFormatPage } from "./paginator.types.js";

export const paginatorRegistry = new Map<string, PaginatorFormatPage<any>>();

const defaultEmojis = {
  first: "⏪",
  previous: "⬅️",
  home: "🏠",
  next: "➡️",
  last: "⏩",
};

export function createPaginatorButtons(
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
