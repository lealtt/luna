import {
  createCommand,
  createContainer,
  createTextDisplay,
  createSection,
  createThumbnail,
  createFile,
  createMediaGallery,
  LunaSeparators,
} from "#discord/creators";
import { ApplicationCommandType, MessageFlags, AttachmentBuilder } from "discord.js";
import { colors } from "#utils";

createCommand({
  name: "Show Case",
  type: ApplicationCommandType.User,
  async run(interaction) {
    const { targetUser, user: author, client } = interaction;

    if (!client.user) return;

    const avatarAttachment = new AttachmentBuilder(targetUser.displayAvatarURL({ size: 512 }), {
      name: "avatar.png",
    });

    // Use createContainer as the main component wrapper.
    const showcaseContainer = createContainer({
      accentColor: colors.teal.num,
      components: [
        // Use createTextDisplay for titles and paragraphs.
        createTextDisplay({
          content: `## 🎨 Component Showcase for ${targetUser.username}`,
        }),
        // Use a pre-built separator from LunaSeparators.
        LunaSeparators.SmallLine,
        // Use createSection to pair text with an accessory.
        createSection({
          text: [
            `This is a **Section** component.`,
            `The accessory on the right is a **Thumbnail** created with createThumbnail.`,
          ],
          // Use createThumbnail for the accessory.
          accessory: createThumbnail({
            url: targetUser.displayAvatarURL({ size: 128 }),
            description: `${targetUser.username}'s Avatar`,
          }),
        }),
        LunaSeparators.Large,
        createTextDisplay({ content: `### Media Gallery Component` }),
        // Use createMediaGallery to display a grid of images.
        createMediaGallery({
          items: [
            {
              url: author.displayAvatarURL({ size: 256 }),
              description: "Avatar of the user who ran the command.",
            },
            {
              url: client.user.displayAvatarURL({ size: 256 }),
              description: "The bot's avatar.",
            },
            {
              url: "https://i.imgur.com/AfFp7pu.png",
              description: "A static image from a URL.",
            },
          ],
        }),
        LunaSeparators.Large,
        createTextDisplay({ content: `### File Component` }),
        createFile({
          url: "attachment://avatar.png",
        }),
      ],
    });

    await interaction.reply({
      components: [showcaseContainer],
      files: [avatarAttachment],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    });
  },
});
