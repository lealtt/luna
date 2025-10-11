import { Events, InteractionType } from "discord.js";
import { createEvent } from "#discord/creators";
import { handleApplicationCommand, handleAutocomplete, handleComponent } from "#discord/handlers";

createEvent({
  name: Events.InteractionCreate,
  async run(interaction) {
    // Ensure guild locale is prioritized for consistent localization
    interaction.locale = interaction.guild?.preferredLocale ?? interaction.locale;

    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        if (
          interaction.isChatInputCommand() ||
          interaction.isUserContextMenuCommand() ||
          interaction.isMessageContextMenuCommand()
        ) {
          await handleApplicationCommand(interaction);
        }
        break;

      case InteractionType.ApplicationCommandAutocomplete:
        await handleAutocomplete(interaction);
        break;

      case InteractionType.MessageComponent:
      case InteractionType.ModalSubmit:
        await handleComponent(interaction);
        break;
    }
  },
});
