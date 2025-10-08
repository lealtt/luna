import { createCommand } from "#discord/creators";
import { logInteraction } from "#discord/middleware";
import { t } from "#utils";
import { ApplicationCommandType, MessageFlags } from "discord.js";

createCommand({
  name: "ping",
  description: "Replies with Pong!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  /**
   * An array of middleware functions that will be executed
   * in sequence before the command's `run` function is called.
   */
  middlewares: [logInteraction],
  run(interaction) {
    const { locale } = interaction;

    const latency = Date.now() - interaction.createdTimestamp;

    interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t(locale, "ping.reply", { latency }),
    });
  },
});
