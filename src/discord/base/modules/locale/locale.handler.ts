import { models } from "#database";
import { onBotEvent } from "#discord/hooks";
import { Locale, type Interaction, type Message } from "discord.js";

onBotEvent(
  "interaction:created",
  async ({ data }) => {
    const interaction = data.interaction as Interaction;
    const userDoc = await models.users.findOne({ userId: interaction.user.id });

    if (userDoc?.locale) {
      interaction.locale = userDoc.locale as Locale;
    } else {
      interaction.locale = interaction.guild?.preferredLocale ?? interaction.locale;
    }
  },
  { name: "locale-interaction-handler", priority: "high", silent: true },
);

onBotEvent(
  "message:created",
  async ({ data }) => {
    const message = data.message as Message;
    const userDoc = await models.users.findOne({ userId: message.author.id });

    if (userDoc?.locale) {
      message.locale = userDoc.locale as Locale;
    } else {
      message.locale = message.guild?.preferredLocale ?? Locale.EnglishUS;
    }
  },
  { name: "locale-message-handler", priority: "high", silent: true },
);
