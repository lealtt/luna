import { createEmbed } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { auditUserContext } from "#discord/middlewares";
import { ApplicationCommandType, MessageFlags } from "discord.js";

createCommand({
  name: "Show Avatar",
  type: ApplicationCommandType.User,
  middlewares: [auditUserContext],
  run(interaction) {
    const targetUser = interaction.targetUser;

    const avatarURL = targetUser.displayAvatarURL({ size: 512 });

    const embed = createEmbed({
      images: avatarURL,
      color: "Blue",
    });

    interaction.reply({
      embeds: [embed],
      flags: [MessageFlags.Ephemeral],
    });
  },
});
