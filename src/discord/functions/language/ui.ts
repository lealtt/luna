import { createLabel, createModal, createStringSelectMenu } from "#discord/builders";
import { type ChatInputCommandInteraction, Locale } from "discord.js";

export function createLanguageModal(interaction: ChatInputCommandInteraction<"cached">) {
  const { user, locale } = interaction;

  const languageSelect = createStringSelectMenu({
    locale,
    customId: "language-select",
    placeholderI18nKey: "language.select_placeholder",
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

  return languageModal;
}
