import { createCommand } from "#discord/creators";
import { logChatInput } from "#discord/middlewares";
import { t } from "#utils";
import { ApplicationCommandType, InteractionContextType, MessageFlags } from "discord.js";

createCommand({
  name: "ping",
  description: "Replies with Pong!",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  cooldown: 5,
  middlewares: [logChatInput],
  run(interaction) {
    const { locale } = interaction;

    const latency = Date.now() - interaction.createdTimestamp;

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t(locale, "ping.reply", { latency }),
    });
  },
});
