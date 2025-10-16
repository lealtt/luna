import {
  type InteractionReplyOptions,
  ButtonStyle,
  type ActionRowBuilder,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { createRow, createButton } from "#discord/builders";
import { paginatorState } from "./paginator.state.js";
import type {
  PaginatorFormatPage,
  PaginatorMenuItem,
  PaginatorOptions,
  PaginatorState,
} from "./paginator.types.js";
import { Timer } from "#utils";

export const paginatorRegistry = new Map<string, PaginatorFormatPage<any>>();

const defaultEmojis = {
  first: "⏪",
  previous: "⬅️",
  home: "🏠",
  next: "➡️",
  last: "⏩",
};

const defaultTimeout = Timer(5).min();

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
      customId: `paginator/button/${paginatorId}/first/${stateId}`,
      emoji: emojis.first,
      style: ButtonStyle.Secondary,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/button/${paginatorId}/prev/${stateId}`,
      emoji: emojis.previous,
      style: ButtonStyle.Primary,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/button/${paginatorId}/home/${stateId}`,
      emoji: emojis.home,
      style: ButtonStyle.Success,
      disabled: currentPage === 0,
    }),
    createButton({
      customId: `paginator/button/${paginatorId}/next/${stateId}`,
      emoji: emojis.next,
      style: ButtonStyle.Primary,
      disabled: currentPage >= totalPages - 1,
    }),
    createButton({
      customId: `paginator/button/${paginatorId}/last/${stateId}`,
      emoji: emojis.last,
      style: ButtonStyle.Secondary,
      disabled: currentPage >= totalPages - 1,
    }),
  );
}

export function createPaginatorMenu<T>(
  paginatorId: string,
  stateId: string,
  menuItems: PaginatorMenuItem<T>[],
  selectedValue?: string,
  placeholder: string = "Select a category...",
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`paginator/menu/${paginatorId}/${stateId}`)
    .setPlaceholder(placeholder)
    .addOptions(
      menuItems.map((item, index) => ({
        label: item.label,
        description: item.description,
        emoji: item.emoji,
        value: item.value || `option_${index}`,
        default: selectedValue === (item.value || `option_${index}`),
      })),
    );

  return createRow(selectMenu);
}

export function createPageIndicatorButton(
  currentPage: number,
  totalPages: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
  return createRow(
    createButton({
      customId: "paginator/indicator/disabled",
      label: `Page ${currentPage + 1}/${totalPages}`,
      style: ButtonStyle.Secondary,
      disabled: true,
    }),
  );
}

export function createPaginator<T>(options: PaginatorOptions<T>): InteractionReplyOptions {
  const {
    paginatorId,
    items,
    itemsPerPage,
    user,
    formatPage,
    emojis,
    style = "buttons",
    menuItems,
    menuPlaceholder,
    timeout = defaultTimeout,
    showPageIndicator = true,
  } = options;

  if (!paginatorRegistry.has(paginatorId)) {
    paginatorRegistry.set(paginatorId, formatPage);
  }

  const now = Date.now();
  const initialState: PaginatorState<T> = {
    items,
    itemsPerPage,
    currentPage: 0,
    userId: user.id,
    paginatorId,
    style,
    menuItems,
    createdAt: now,
    lastInteraction: now,
    emojis,
    showPageIndicator,
  };

  const stateId = paginatorState.set(initialState, timeout > 0 ? timeout : undefined);

  if (timeout > 0) {
    setupAutoCleanup(stateId, timeout);
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const initialPageItems = items.slice(0, itemsPerPage);
  const embed = formatPage(initialPageItems, 1, totalPages);

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if ((style === "menu" || style === "both") && menuItems && menuItems.length > 0) {
    components.push(
      createPaginatorMenu(paginatorId, stateId, menuItems, undefined, menuPlaceholder),
    );
  }

  if (style === "buttons" || style === "both") {
    components.push(createPaginatorButtons(paginatorId, stateId, 0, totalPages, emojis));
  }

  if (showPageIndicator && totalPages > 1) {
    components.push(createPageIndicatorButton(0, totalPages));
  }

  return { embeds: [embed], components };
}

// Auto-cleanup inactive paginators
function setupAutoCleanup(stateId: string, timeout: number): void {
  setTimeout(() => {
    const state = paginatorState.get(stateId);
    if (state && Date.now() - state.lastInteraction >= timeout) {
      paginatorState.delete(stateId);
    }
  }, timeout + 1000); // Add a small buffer to avoid race conditions
}
