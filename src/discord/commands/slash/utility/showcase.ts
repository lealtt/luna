import {
  createButton,
  createContainer,
  createFile,
  createRow,
  createTextDisplay,
} from "#discord/builders";
import {
  createMediaGallery,
  createSection,
  createThumbnail,
  LunaSeparators,
} from "#discord/builders";
import { createCommand } from "#discord/modules";
import { colors } from "#utils";
import {
  ApplicationCommandType,
  AttachmentBuilder,
  ButtonStyle,
  InteractionContextType,
} from "discord.js";

createCommand({
  name: "showcase",
  description: "Displays a showcase of all V2 components.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    // Get essential info from the interaction object.
    const { locale, user, client } = interaction;

    // Get avatar URLs directly from the user and client objects.
    const userAvatar = user.displayAvatarURL({ size: 256 });
    const botAvatar = client.user.displayAvatarURL({ size: 256 });

    // Parse the URL to get the correct file extension (.png, .jpg, .gif, etc.).
    const avatarUrl = new URL(userAvatar);
    const extension = avatarUrl.pathname.split(".").pop();

    // Set the filename with the dynamic extension.
    const attachmentFilename = `${user.username}-avatar.${extension}`;

    // Create the AttachmentBuilder with the user's avatar and the dynamic filename.
    const avatarAttachment = new AttachmentBuilder(userAvatar, {
      name: attachmentFilename,
    });

    // Build the array of components that will be displayed in the reply.
    const showcaseComponents = createContainer({
      accentColor: colors.magenta.num,
      components: [
        // Section 1: Title, description, and a thumbnail accessory.
        createSection({
          locale,
          text: [{ i18nKey: "showcase.title" }, { i18nKey: "showcase.description" }],
          accessory: createThumbnail({
            locale,
            url: userAvatar,
            i18nKey: "showcase.thumbnail_desc",
          }),
        }),

        LunaSeparators.LargeLine,

        // Section 2: A media gallery showcasing both the user's and the bot's avatars.
        createMediaGallery({
          locale,
          items: [
            userAvatar,
            {
              url: botAvatar,
              i18nKey: "showcase.gallery_item_desc",
            },
          ],
        }),

        LunaSeparators.LargeLine,

        // Section 3: An action row with two standard buttons.
        createRow(
          createButton({
            locale,
            customId: "showcase/button/primary",
            labelI18nKey: "showcase.button_primary",
            style: ButtonStyle.Primary,
          }),
          createButton({
            locale,
            customId: "showcase/button/secondary",
            labelI18nKey: "showcase.button_secondary",
            style: ButtonStyle.Secondary,
          }),
        ),

        LunaSeparators.Small,

        // This references the attachment by its filename.
        createTextDisplay({ locale, i18nKey: "showcase.file_title" }),
        createFile(`attachment://${attachmentFilename}`),
      ],
    });

    // Reply to the interaction with the built components and the file attachment.
    await interaction.reply({
      flags: ["IsComponentsV2", "Ephemeral"],
      components: [showcaseComponents],
      files: [avatarAttachment],
    });
  },
});
