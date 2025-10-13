import { createEmbed } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { auditUserContext } from "#discord/middlewares";
import { ApplicationCommandType, InteractionContextType, MessageFlags } from "discord.js";

createCommand({
  name: "Show Avatar",
  type: ApplicationCommandType.User,
  middlewares: [auditUserContext],
  contexts: [InteractionContextType.Guild],
  run(interaction) {
    const { targetUser } = interaction;

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
