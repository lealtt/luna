import { ComponentInteractionType } from "#discord/registry";
import { createComponent } from "#discord/creators";
import { MessageFlags } from "discord.js";
import { t } from "#utils";
import { z } from "zod";

createComponent({
  customId: "actions/{type}/{userid}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  paramsSchema: z.object({
    // The type of action must be one of the following values.
    type: z.enum(["kick", "ban", "timeout"]),
    // The user's ID must be a string.
    userid: z.string(),
  }),
  // Thanks to the schema, `type` and `userid` are now fully type-safe.
  async run(interaction, { type, userid }) {
    await interaction.deferUpdate();

    const { locale } = interaction;

    let content: string;

    switch (type) {
      case "kick":
        content = t(locale, "mod_actions.kick_success", { userid });
        break;

      case "ban":
        content = t(locale, "mod_actions.ban_success", { userid });
        break;

      case "timeout":
        content = t(locale, "mod_actions.timeout_success", { userid });
        break;

      // The default case is kept as a safety fallback,
      // even though Zod ensures `type` is one of the above.
      default:
        content = t(locale, "mod_actions.unknown_action");
        break;
    }

    await interaction.followUp({
      content,
      flags: [MessageFlags.Ephemeral],
    });
  },
});
