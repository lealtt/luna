import {
  createPrefixCommand,
  createContainer,
  createSection,
  createTextDisplay,
  createButton,
  LunaSeparators,
} from "#discord/creators";
import { checkPermissions } from "#discord/middlewares";
import { Finder, colors, t } from "#utils";
import { MessageFlags, ButtonStyle, userMention, PermissionFlagsBits } from "discord.js";
import { z } from "zod";

const ModFlagsSchema = z.object({
  user: z.string({ error: "You must specify a user to moderate." }),
});

createPrefixCommand({
  name: "mod",
  flags: {
    schema: ModFlagsSchema,
    config: {
      user: { aliases: ["u"], separator: ":" },
    },
  },
  middlewares: [
    checkPermissions(PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.BanMembers),
  ],
  async run(message, flags) {
    const { guild, locale } = message;
    const { user: userInput } = flags;

    if (!guild) return;

    const userId = userInput.match(/\d+/)?.[0];
    if (!userId) {
      await message.reply(t(locale, "common_errors.invalid_user_format"));
      return;
    }

    const memberToMod = await Finder(message, userId).member(guild);
    if (!memberToMod) {
      await message.reply(t(locale, "common_errors.member_not_found"));
      return;
    }

    const kickSection = createSection({
      text: [t(locale, "mod_panel.kick_description")],
      accessory: createButton({
        customId: `actions/kick/${memberToMod.id}`,
        label: t(locale, "mod.kick_button"),
        style: ButtonStyle.Danger,
      }),
    });

    const banSection = createSection({
      text: [t(locale, "mod_panel.ban_description")],
      accessory: createButton({
        customId: `actions/ban/${memberToMod.id}`,
        label: t(locale, "mod.ban_button"),
        style: ButtonStyle.Danger,
      }),
    });

    const timeoutSection = createSection({
      text: [t(locale, "mod_panel.timeout_description")],
      accessory: createButton({
        customId: `actions/timeout/${memberToMod.id}`,
        label: t(locale, "mod.timeout_button"),
        style: ButtonStyle.Secondary,
      }),
    });

    const titleSection = createTextDisplay({
      content: `### ${t(locale, "mod_panel.title", { user: userMention(memberToMod.id) })}`,
    });

    const container = createContainer({
      accentColor: colors.blurple.num,
      components: [
        titleSection,
        LunaSeparators.Small,
        kickSection,
        banSection,
        timeoutSection,
        LunaSeparators.Small,
      ],
    });

    await message.reply({
      components: [container],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
});
