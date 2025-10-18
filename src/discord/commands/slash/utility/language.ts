import { createLabel, createModal, createStringSelectMenu } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { ApplicationCommandType, InteractionContextType, Locale } from "discord.js";

createCommand({
  name: "language",
  description: "Set your preferred language for the bot.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { user, locale } = interaction;

    const languageSelect = createStringSelectMenu({
      locale,
      customId: "language-select",
      placeholderI18nKey: "language.select_placeholder",
      required: false,
      options: [
        {
          label: "English (US)",
          value: Locale.EnglishUS,
          emoji: "🇺🇸",
        },
        {
          label: "Português (Brasil)",
          value: Locale.PortugueseBR,
          emoji: "🇧🇷",
        },
        {
          label: "Spanish (ES)",
          value: Locale.SpanishES,
          emoji: "🇪🇸",
        },
      ],
    });

    const selectLabel = createLabel({
      locale,
      i18nKey: "language.select_label",
      component: languageSelect,
    });

    const languageModal = createModal({
      locale,
      customId: `language/set/${user.id}`,
      titleI18nKey: "language.modal_title",
      components: [selectLabel],
    });

    await interaction.showModal(languageModal);
  },
});
