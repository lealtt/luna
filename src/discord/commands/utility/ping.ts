import { createCommand } from "#discord/creators";
import { t } from "#utils";
import { ApplicationCommandType, MessageFlags } from "discord.js";

createCommand({
  name: "ping",
  description: "Replies with Pong!",
  type: ApplicationCommandType.ChatInput,
  cooldown: 5,
  async run(interaction) {
    const { locale } = interaction;

    const latency = Date.now() - interaction.createdTimestamp;

    await interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t(locale, "ping.reply", { latency }),
    });
  },
});
