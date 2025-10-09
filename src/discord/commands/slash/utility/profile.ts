import { createCommand, createEmbed, createModal, createTextInput } from "#discord/creators";
import { models } from "#database";
import { t } from "#utils";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  TextInputStyle,
  time,
} from "discord.js";

createCommand({
  name: "profile",
  description: "View or set a user's profile.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  options: [
    {
      name: "view",
      description: "View a user's profile card.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user whose profile you want to see.",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "set",
      description: "Set your custom 'About Me' description.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
  async run(interaction) {
    const { options, guild, user, locale } = interaction;

    const subcommand = options.getSubcommand(true);

    switch (subcommand) {
      case "view": {
        const targetUser = options.getUser("user") ?? user;
        const userDoc = await models.users.findOrCreate(targetUser.id);
        const member = await userDoc.fetchMember(guild!);

        const embed = createEmbed({
          author: {
            name: t(locale, "profile.embed_author", { user: targetUser.username }),
            icon_url: targetUser.displayAvatarURL(),
          },
          description: userDoc.about ?? t(locale, "profile.no_about_me"),
          fields: [
            {
              name: t(locale, "profile.joined_field"),
              value: member?.joinedAt ? time(member.joinedAt, "R") : "N/A",
              inline: true,
            },
            {
              name: t(locale, "profile.registered_field"),
              value: time(targetUser.createdAt, "R"),
              inline: true,
            },
          ],
          thumbnail: {
            url: member?.displayAvatarURL() ?? targetUser.displayAvatarURL(),
          },
          footer: {
            text: t(locale, "profile.footer", { id: userDoc.userId }),
          },
        });

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case "set": {
        const userDoc = await models.users.findOrCreate(user.id);

        const aboutMeInput = createTextInput({
          customId: "profile/about",
          label: t(locale, "profile.about_modal_label"),
          placeholder: t(locale, "profile.about_modal_placeholder"),
          style: TextInputStyle.Paragraph,
          maxLength: 200,
          required: false,
          value: userDoc.about ?? "",
        });

        const profileModal = createModal({
          customId: `profile/set/${user.id}`,
          title: t(locale, "profile.about_modal_title"),
          components: [aboutMeInput],
        });

        await interaction.showModal(profileModal);
        break;
      }
    }
  },
});
