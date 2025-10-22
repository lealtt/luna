import { Events, InteractionType, type Locale, Collection, type Interaction } from "discord.js";
import { createEvent } from "../modules/events/events.module.js";
import {
  handleApplicationCommand,
  handleAutocomplete,
} from "../modules/commands/command.handler.js";
import { handleComponentInteraction } from "../modules/components/component.handler.js";
import type { StorableCommand } from "../modules/commands/command.types.js";
import { logger } from "#utils";
import {
  nimbus,
  defaultLocale,
  lunaLocaleAdapter,
  isSupportedLocale,
  type AppLocales,
} from "#translate";
import { models } from "#database";
import { userLocaleCache } from "#states";

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
  async run(interaction: Interaction) {
    let resolvedAppLocale: AppLocales = defaultLocale;
    const userId = interaction.user.id;

    const cachedLocale = userLocaleCache.get(userId);

    if (cachedLocale !== undefined) {
      if (cachedLocale && isSupportedLocale(cachedLocale)) {
        resolvedAppLocale = cachedLocale;
      } else {
        resolvedAppLocale = lunaLocaleAdapter.resolveLocale(interaction.locale, defaultLocale);
      }
    } else {
      try {
        const userDb = await models.users.findOrCreate(userId);
        const userLocalePreference = userDb.locale;

        if (userLocalePreference && isSupportedLocale(userLocalePreference)) {
          resolvedAppLocale = userLocalePreference as AppLocales;
          userLocaleCache.set(userId, resolvedAppLocale);
        } else {
          resolvedAppLocale = lunaLocaleAdapter.resolveLocale(interaction.locale, defaultLocale);
          userLocaleCache.set(userId, null);
        }
      } catch (dbError) {
        logger.error(`Error fetching/processing user locale for ${userId}:`, dbError);
        try {
          resolvedAppLocale = lunaLocaleAdapter.resolveLocale(interaction.locale, defaultLocale);
        } catch (resolveError) {
          logger.error(`Error resolving fallback locale for ${userId}:`, resolveError);
          resolvedAppLocale = defaultLocale;
        }
      }
    }

    try {
      lunaLocaleAdapter.setCurrentLocale(resolvedAppLocale);
      nimbus.syncLocale();
    } catch (error) {
      logger.error(`Error setting locale for interaction from user ${userId}:`, error);
      lunaLocaleAdapter.setCurrentLocale(defaultLocale);
      nimbus.syncLocale();
    }

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
