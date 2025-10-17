import { onBotEvent } from "#discord/hooks";
import { Locale, type Interaction, type Message } from "discord.js";
import { logger, Timer } from "#utils";
import { getUserLocale, isValidLocale } from "./locale.service.js";

type LocaleContext = Interaction | Message;

function resolveLocale(
  context: LocaleContext,
  userLocale: Locale | null | undefined,
  defaultFallback: Locale,
): Locale {
  if (userLocale && isValidLocale(userLocale)) {
    return userLocale;
  }

  const guildPreferredLocale = context.guild?.preferredLocale;
  if (guildPreferredLocale) {
    return guildPreferredLocale;
  }

  if ("locale" in context && context.locale && isValidLocale(context.locale)) {
    return context.locale;
  }
  return defaultFallback;
}

onBotEvent(
  "interaction:created",
  async ({ data }) => {
    const interaction = data.interaction as Interaction;
    let fallbackLocale = Locale.EnglishUS;

    if (interaction.locale && isValidLocale(interaction.locale)) {
      fallbackLocale = interaction.locale;
    } else if (interaction.guild?.preferredLocale) {
      fallbackLocale = interaction.guild.preferredLocale;
    }

    try {
      const userLocale = await getUserLocale(interaction.user.id);
      interaction.locale = resolveLocale(interaction, userLocale, fallbackLocale);
    } catch (error) {
      logger.error(`Error setting locale for interaction from user ${interaction.user.id}:`, error);
      interaction.locale = fallbackLocale;
    }
  },
  {
    name: "locale-interaction-handler",
    priority: "high",
    silent: true,
    timeout: Timer(5).sec(),
  },
);

onBotEvent(
  "message:created",
  async ({ data }) => {
    const message = data.message as Message;
    if (!message.author || message.author.bot) {
      return;
    }
    const fallbackLocale = message.guild?.preferredLocale ?? Locale.EnglishUS;

    try {
      const userLocale = await getUserLocale(message.author.id);
      message.locale = resolveLocale(message, userLocale, fallbackLocale);
    } catch (error) {
      logger.error(`Error setting locale for message from user ${message.author.id}:`, error);
      message.locale = fallbackLocale;
    }
  },
  {
    name: "locale-message-handler",
    priority: "high",
    silent: true,
    timeout: Timer(5).sec(),
  },
);
