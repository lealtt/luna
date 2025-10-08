import { ComponentInteractionType } from "#discord/registry";
import { createComponent } from "#discord/creators";
import { t } from "#utils";
import { MessageFlags } from "discord.js";

createComponent({
  customId: "actions/{type}/{userid}",
  type: ComponentInteractionType.Button,
  async run(interaction, { type, userid }) {
    await interaction.deferUpdate();

    const lang = interaction.locale;
    let content: string;

    switch (type) {
      case "kick":
        content = t(lang, "mod_actions.kick_success", { userid });
        break;

      case "ban":
        content = t(lang, "mod_actions.ban_success", { userid });
        break;

      case "timeout":
        content = t(lang, "mod_actions.timeout_success", { userid });
        break;

      default:
        content = t(lang, "mod_actions.unknown_action");
        break;
    }

    await interaction.followUp({
      content,
      flags: [MessageFlags.Ephemeral],
    });
  },
});
