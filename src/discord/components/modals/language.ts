import { createComponent, ComponentInteractionType } from "#discord/modules";
import { models } from "#database";
import { extractModalValues, t } from "#utils";
import { Locale } from "discord.js";

createComponent({
  customId: "language/set/{userId}",
  type: ComponentInteractionType.Modal,
  cached: "cached",
  async run(interaction, { userId }) {
    await interaction.deferReply({ flags: "Ephemeral" });

    const { language } = extractModalValues(interaction, {
      language: ["language-select", "strings"],
    });

    const selectedLocale = language[0] as Locale;

    await models.users.updateProfile(userId, { locale: selectedLocale });

    await interaction.editReply({
      content: t(selectedLocale, "language.success_message"),
    });
  },
});
