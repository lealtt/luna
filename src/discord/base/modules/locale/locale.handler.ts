import { onBotEvent } from "#discord/hooks";
import { type Interaction, type Message } from "discord.js";
import { logger, Timer, defaultLocale } from "#utils";
import { getUserLocale } from "./locale.service.js";

onBotEvent(
  "interaction:created",
  async ({ data }) => {
    const interaction = data.interaction as Interaction;

    try {
      const userLocale = await getUserLocale(interaction.user.id);

      interaction.locale = userLocale ?? defaultLocale;
    } catch (error) {
      logger.error(`Error setting locale for interaction from user ${interaction.user.id}:`, error);
      interaction.locale = defaultLocale;
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

    try {
      const userLocale = await getUserLocale(message.author.id);

      message.locale = userLocale ?? defaultLocale;
    } catch (error) {
      logger.error(`Error setting locale for message from user ${message.author.id}:`, error);
      message.locale = defaultLocale;
    }
  },
  {
    name: "locale-message-handler",
    priority: "high",
    silent: true,
    timeout: Timer(5).sec(),
  },
);
