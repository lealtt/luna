import { createCommand } from "#discord/modules";
import { commandLoggerMiddleware } from "#middlewares";
import { t } from "#translate";
import { ApplicationCommandType, InteractionContextType } from "discord.js";

createCommand({
  name: "ping",
  description: "Replies with Pong!",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  middlewares: [commandLoggerMiddleware],
  async run(interaction) {
    await interaction.reply(t("ping.reply", { latency: interaction.client.ws.ping }));
  },
});
