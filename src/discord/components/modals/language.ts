import { createComponent, ComponentInteractionType } from "#discord/modules";
import { models } from "#database";
import { extractModalValues, t } from "#utils";

createComponent({
  customId: "language/set/{userId}",
  type: ComponentInteractionType.Modal,
  cached: "cached",
  async run(interaction, { userId }) {
    await interaction.deferReply({ flags: "Ephemeral" });

    const { language } = extractModalValues(interaction, {
      language: ["language-select", "strings"],
    });

    const [locale] = language;

    await models.users.updateProfile(userId, { locale });

    await interaction.editReply({
      content: t(locale, "language.success_message"),
    });
  },
});
