import { createButton, createRow } from "#discord/builders";
import { createCommand } from "#discord/modules";
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
    const { locale, options } = interaction;
    const targetUser = options.getUser("user", true);

    interaction.reply({
      flags: [MessageFlags.Ephemeral],
      content: t(locale, "mod.reply", { user: targetUser }),
      components: [
        createRow(
          createButton({
            locale,
            customId: `actions/kick/${targetUser.id}`,
            labelI18nKey: "mod.kick_button",
            style: ButtonStyle.Danger,
          }),
          createButton({
            locale,
            customId: `actions/ban/${targetUser.id}`,
            labelI18nKey: "mod.ban_button",
            style: ButtonStyle.Danger,
          }),
          createButton({
            locale,
            customId: `actions/timeout/${targetUser.id}`,
            labelI18nKey: "mod.timeout_button",
            style: ButtonStyle.Secondary,
          }),
        ),
      ],
    });
  },
});
