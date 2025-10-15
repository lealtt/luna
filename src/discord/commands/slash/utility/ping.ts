import { createCommand } from "#discord/modules";
import { t } from "#utils";
import { ApplicationCommandType, InteractionContextType } from "discord.js";

createCommand({
  name: "ping",
  description: "Replies with Pong!",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const { locale } = interaction;

    const latency = Date.now() - interaction.createdTimestamp;

    await interaction.editReply({
      content: t(locale, "ping.reply", { latency }),
    });
  },
});
