import { createComponent } from "#discord/creators";
import { models } from "#database";
import { t } from "#utils";
import { ComponentInteractionType } from "#discord/registry";
import { MessageFlags } from "discord.js";

createComponent({
  customId: "profile/set/{userId}",
  type: ComponentInteractionType.Modal,
  cached: "cached",
  async run(interaction, { userId }) {
    const { fields, locale } = interaction;
    const aboutMeText = fields.getTextInputValue("profile/about");

    await models.users.updateProfile(userId, {
      about: aboutMeText || null,
    });

    await interaction.reply({
      content: t(locale, "profile.success_message"),
      flags: [MessageFlags.Ephemeral],
    });
  },
});
