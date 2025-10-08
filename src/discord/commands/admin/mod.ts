import { createButton, createCommand, createRow } from "#discord/creators";
import { t } from "#utils";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  userMention,
} from "discord.js";

createCommand({
  name: "mod",
  description: "Moderate any member.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: ["KickMembers", "BanMembers", "ModerateMembers"],
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Select any user.",
      required: true,
    },
  ],
  run(interaction) {
    const lang = interaction.locale;
    const targetUser = interaction.options.getUser("user", true);

    interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t(lang, "mod.reply", { user: userMention(targetUser.id) }),
      components: [
        createRow(
          createButton({
            customId: `actions/kick/${targetUser.id}`,
            label: t(lang, "mod.kick_button"),
            style: ButtonStyle.Danger,
          }),
          createButton({
            customId: `actions/ban/${targetUser.id}`,
            label: t(lang, "mod.ban_button"),
            style: ButtonStyle.Danger,
          }),
          createButton({
            customId: `actions/timeout/${targetUser.id}`,
            label: t(lang, "mod.timeout_button"),
            style: ButtonStyle.Secondary,
          }),
        ),
      ],
    });
  },
});
