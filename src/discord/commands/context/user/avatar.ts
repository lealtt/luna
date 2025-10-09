import { createCommand, createEmbed } from "#discord/creators";
import { logUserContext } from "#discord/middlewares";
import { ApplicationCommandType, MessageFlags } from "discord.js";

createCommand({
  name: "Show Avatar",
  type: ApplicationCommandType.User,
  /**
   * An array of middleware functions that will be executed
   * in sequence before the command's `run` function is called.
   */
  middlewares: [logUserContext],
  run(interaction) {
    const targetUser = interaction.targetUser;

    const avatarURL = targetUser.displayAvatarURL({ size: 512 });

    const embed = createEmbed({
      image: {
        url: avatarURL,
      },
      color: "Blue",
    });

    interaction.reply({
      embeds: [embed],
      flags: [MessageFlags.Ephemeral],
    });
  },
});
