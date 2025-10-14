import { createComponent, ComponentInteractionType } from "#discord/modules";
import { likeState } from "#states";
import { t } from "#utils";
import { MessageFlags, userMention } from "discord.js";

createComponent({
  customId: "like/{stateId}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  async run(interaction, { stateId }) {
    const { locale } = interaction;

    // Get the state using the ID from the button.
    const state = likeState.get(stateId);

    // If the state has expired or is invalid, do nothing.
    if (!state) {
      return interaction.reply({
        content: t(locale, "like_component.like_expired"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { targetId } = state;
    const clicker = interaction.user;

    // You can add a check here to prevent people from liking their own mention
    if (clicker.id === targetId) {
      return interaction.reply({
        content: t(locale, "like_component.like_self"),
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      content: t(locale, "like_component.like_success", {
        user: userMention(targetId),
      }),
      flags: MessageFlags.Ephemeral,
    });

    likeState.delete(stateId);
  },
});
