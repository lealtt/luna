import { createCommand } from "#discord/modules";
import { ApplicationCommandType, InteractionContextType } from "discord.js";
import { language } from "#discord/functions";

createCommand({
  name: "language",
  description: "Set your preferred language for the bot.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const languageModal = language.createLanguageModal(interaction);

    await interaction.showModal(languageModal);
  },
});
