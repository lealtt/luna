import { createCommand } from "#discord/modules";
import { t } from "#translate";
import { kui } from "@lealt/kaori";
import { ApplicationCommandType, InteractionContextType, Locale } from "discord.js";

createCommand({
  name: "language",
  description: "Set your preferred language for the bot.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { user } = interaction;

    const languageSelect = kui.menu.string({
      customId: "language-select",
      placeholder: t("commands.language.description"),
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

    const selectLabel = kui.modal.label({
      label: t("language.select_label"),
      component: languageSelect,
    });

    const languageModal = kui.modal.create({
      customId: `language/set/${user.id}`,
      title: t("language.modal_title"),
      components: [selectLabel],
    });

    await interaction.showModal(languageModal);
  },
});
