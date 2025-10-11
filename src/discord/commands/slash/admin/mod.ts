import { createButton, createRow } from "#discord/builders";
import { createCommand } from "#discord/creators";
import { t } from "#utils";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";

createCommand({
  name: "mod",
  description: "Moderate any member.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.BanMembers],
  options: [
    {
      type: ApplicationCommandOptionType.User,
      name: "user",
      description: "Select any user.",
      required: true,
    },
  ],
  run(interaction) {
    const { locale, options, user } = interaction;
    const targetUser = options.getUser("user", true);

    interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t(locale, "mod.reply", { user }),
      components: [
        createRow(
          createButton({
            customId: `actions/kick/${targetUser.id}`,
            label: t(locale, "mod.kick_button"),
            style: ButtonStyle.Danger,
          }),
          createButton({
            customId: `actions/ban/${targetUser.id}`,
            label: t(locale, "mod.ban_button"),
            style: ButtonStyle.Danger,
          }),
          createButton({
            customId: `actions/timeout/${targetUser.id}`,
            label: t(locale, "mod.timeout_button"),
            style: ButtonStyle.Secondary,
          }),
        ),
      ],
    });
  },
});
