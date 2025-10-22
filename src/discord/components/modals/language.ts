import { models } from "#database";
import { createComponent, ComponentInteractionType } from "#discord/modules";
import { nimbus, defaultLocale, isSupportedLocale, type AppLocales } from "#translate";
import { logger } from "#utils";
import { kut } from "@lealt/kaori";
import { userLocaleCache } from "#states";

createComponent({
  customId: "language/set/{userId}",
  type: ComponentInteractionType.Modal,
  async run(interaction, { userId }) {
    await interaction.deferReply({ flags: "Ephemeral" });

    const { language } = kut.interaction.extractModalValues(interaction, {
      language: ["language-select", "strings"],
    });

    const [selectedLocaleString] = language;

    const localeToSave = isSupportedLocale(selectedLocaleString)
      ? (selectedLocaleString as AppLocales)
      : null;

    if (localeToSave === null && selectedLocaleString) {
      logger.warn(
        `Invalid locale selected via modal for user ${userId}: ${selectedLocaleString}. Clearing locale.`,
      );
    }

    try {
      await models.users.updateProfile(userId, { locale: localeToSave });
      userLocaleCache.set(userId, localeToSave);
    } catch (error) {
      logger.error(`Failed to update locale in DB for user ${userId}:`, error);
      await interaction.editReply({
        content: nimbus.tLocale(defaultLocale, "common_errors.generic"),
      });
      return;
    }

    const localeFlagMap: Record<string, string> = {
      "pt-BR": "🇧🇷",
      "en-US": "🇺🇸",
      "es-ES": "🇪🇸",
    };

    const flag = localeFlagMap[selectedLocaleString] || "🏳️";
    const targetLocaleForReply = localeToSave ?? defaultLocale;

    await interaction.editReply({
      content: nimbus.tLocale(targetLocaleForReply, "language.success_message", { flag }),
    });
  },
});
