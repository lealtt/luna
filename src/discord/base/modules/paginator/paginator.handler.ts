import { MessageFlags } from "discord.js";
import { t } from "#utils";
import { paginatorState } from "#states";
import { paginatorRegistry, createPaginatorButtons } from "./paginator.module.js";
import { ComponentInteractionType } from "../components/component.types.js";
import { createComponent } from "../components/component.module.js";

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
