import { createComponent, ComponentInteractionType, updateUserLocale } from "#discord/modules";
import { extractModalValues, t } from "#utils";

createComponent({
  customId: "language/set/{userId}",
  type: ComponentInteractionType.Modal,
  async run(interaction, { userId }) {
    await interaction.deferReply({ flags: "Ephemeral" });

    const { language } = extractModalValues(interaction, {
      language: ["language-select", "strings"],
    });

    const [locale] = language;

    await updateUserLocale(userId, locale);

    await interaction.editReply({
      content: t(locale, "language.success_message"),
    });
  },
});
