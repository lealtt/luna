import { Events, InteractionType, Locale, Message } from "discord.js";
import { createEvent } from "#discord/modules";
import {
  handleApplicationCommand,
  handleAutocomplete,
  handleComponentInteraction,
  handlePrefixCommand,
} from "#discord/handlers";
import { userLocaleState } from "#states";

/**
 * Augments the discord.js Message class with a custom getter for 'locale'.
 * This centralizes the logic for getting the locale for prefix commands.
 * Priority: Guild > User Cache > Fallback.
 */
Object.defineProperty(Message.prototype, "locale", {
  get: function (): Locale {
    if (this.guild) return this.guild.preferredLocale;

    const cachedState = userLocaleState.get(this.author.id);
    if (cachedState) {
      return cachedState.locale;
    }

    return Locale.EnglishUS;
  },
});

/**
 * Handles the InteractionCreate event to route interactions to the correct handlers.
 */
createEvent({
  name: Events.InteractionCreate,
  silent: true,
  async run(interaction) {
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
        await handleComponentInteraction(interaction);
        break;
    }
  },
});

/**
 * Handles the MessageCreate event to process prefix commands.
 */
createEvent({
  name: Events.MessageCreate,
  silent: true,
  async run(message) {
    await handlePrefixCommand(message);
  },
});
