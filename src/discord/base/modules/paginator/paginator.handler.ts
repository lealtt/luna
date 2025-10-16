import { MessageFlags } from "discord.js";
import { t } from "#utils";
import { paginatorState } from "./paginator.state.js";
import {
  paginatorRegistry,
  createPaginatorButtons,
  createPaginatorMenu,
  createPageIndicatorButton,
} from "./paginator.module.js";
import { ComponentInteractionType } from "../components/component.types.js";
import { createComponent } from "../components/component.module.js";

// Button handler
createComponent({
  customId: "paginator/button/{paginatorId}/{direction}/{stateId}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  silent: true,
  async run(interaction, { paginatorId, direction, stateId }) {
    const formatPage = paginatorRegistry.get(paginatorId);
    const state = paginatorState.get(stateId);

    if (!formatPage || !state || interaction.user.id !== state.userId) {
      return interaction.reply({
        content: t(interaction.locale, "common_errors.component_unauthorized"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Update last interaction time
    state.lastInteraction = Date.now();

    const { items, itemsPerPage, style, menuItems, emojis, showPageIndicator } = state;
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

    if (newPage === state.currentPage) {
      return interaction.deferUpdate();
    }

    const pageItems = items.slice(newPage * itemsPerPage, (newPage + 1) * itemsPerPage);
    const embed = formatPage(pageItems, newPage + 1, totalPages);

    const components = [];

    // Rebuild components based on style
    if ((style === "menu" || style === "both") && menuItems && menuItems.length > 0) {
      components.push(
        createPaginatorMenu(paginatorId, stateId, menuItems, state.selectedMenuValue),
      );
    }

    if (style === "buttons" || style === "both") {
      components.push(createPaginatorButtons(paginatorId, stateId, newPage, totalPages, emojis));
    }

    if (showPageIndicator) {
      components.push(createPageIndicatorButton(newPage, totalPages));
    }

    paginatorState.update(stateId, { ...state, currentPage: newPage });
    await interaction.update({ embeds: [embed], components });
  },
});

// Menu handler
createComponent({
  customId: "paginator/menu/{paginatorId}/{stateId}",
  type: ComponentInteractionType.StringSelect,
  cached: "cached",
  silent: true,
  async run(interaction, { paginatorId, stateId }) {
    const formatPage = paginatorRegistry.get(paginatorId);
    const state = paginatorState.get(stateId);

    if (!formatPage || !state || interaction.user.id !== state.userId) {
      return interaction.reply({
        content: t(interaction.locale, "common_errors.component_unauthorized"),
        flags: MessageFlags.Ephemeral,
      });
    }

    // Update last interaction time
    state.lastInteraction = Date.now();

    const selectedValue = interaction.values[0];
    const { menuItems, itemsPerPage, style, emojis, showPageIndicator } = state;

    if (!menuItems) return;

    // Find selected menu item
    const selectedMenuItem = menuItems.find(
      (item, index) => (item.value || `option_${index}`) === selectedValue,
    );

    if (!selectedMenuItem) return;

    // Update items and reset to first page
    const newItems = selectedMenuItem.items;
    const totalPages = Math.ceil(newItems.length / itemsPerPage);
    const pageItems = newItems.slice(0, itemsPerPage);
    const embed = formatPage(pageItems, 1, totalPages);

    const components = [];

    // Rebuild components
    components.push(createPaginatorMenu(paginatorId, stateId, menuItems, selectedValue));

    if (style === "buttons" || style === "both") {
      components.push(createPaginatorButtons(paginatorId, stateId, 0, totalPages, emojis));
    }

    if (showPageIndicator) {
      components.push(createPageIndicatorButton(0, totalPages));
    }

    paginatorState.update(stateId, {
      ...state,
      items: newItems,
      currentPage: 0,
      selectedMenuValue: selectedValue,
    });

    await interaction.update({ embeds: [embed], components });
  },
});
