import { Events, InteractionType, Locale, Collection } from "discord.js";
import { createEvent } from "./modules/events/events.module.js";
import {
  handleApplicationCommand,
  handleAutocomplete,
} from "./modules/commands/command.handler.js";
import { handleComponentInteraction } from "./modules/components/component.handler.js";
import { handlePrefixCommand } from "./modules/prefix/prefix.handler.js";
import { models } from "#database";
import type { StorableCommand } from "./modules/commands/command.types.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, StorableCommand>;
  }

  export interface Message {
    locale: Locale;
  }

  export interface BaseInteraction {
    locale: Locale;
  }
}

createEvent({
  name: Events.InteractionCreate,
  silent: true,
  async run(interaction) {
    const userDoc = await models.users.findOne({ userId: interaction.user.id });

    if (userDoc?.locale) {
      interaction.locale = userDoc.locale;
    } else {
      interaction.locale = interaction.guild?.preferredLocale ?? interaction.locale;
    }

    // console.log(interaction.locale);

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

createEvent({
  name: Events.MessageCreate,
  silent: true,
  async run(message) {
    if (!message.author || message.author.bot) return;
    const userDoc = await models.users.findOne({ userId: message.author.id });

    if (userDoc?.locale) {
      message.locale = userDoc.locale;
    } else {
      message.locale = message.guild?.preferredLocale ?? Locale.EnglishUS;
    }

    // console.log(message.locale);

    await handlePrefixCommand(message);
  },
});
