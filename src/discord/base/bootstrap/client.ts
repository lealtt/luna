import { Events, InteractionType, Locale, Collection } from "discord.js";
import { createEvent } from "../modules/events/events.module.js";
import {
  handleApplicationCommand,
  handleAutocomplete,
} from "../modules/commands/command.handler.js";
import { handleComponentInteraction } from "../modules/components/component.handler.js";
import { handlePrefixCommand } from "../modules/prefix/prefix.handler.js";
import type { StorableCommand } from "../modules/commands/command.types.js";
import { emitBotEvent } from "../hooks/hooks.modules.js";

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
    await emitBotEvent("interaction:created", interaction.client, { interaction });

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

    await emitBotEvent("message:created", message.client, { message });

    await handlePrefixCommand(message);
  },
});
