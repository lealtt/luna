import { createComponent } from "#discord/creators";
import { t, logger } from "#utils";
import { ComponentInteractionType } from "#discord/registry";
import { MessageFlags } from "discord.js";

createComponent({
  customId: "report/{userId}",
  type: ComponentInteractionType.Modal,
  async run(interaction, { userId }) {
    const { fields, locale } = interaction;

    const subject = fields.getTextInputValue("report/subject");
    const description = fields.getTextInputValue("report/description");

    logger.info(`New report submitted by user ${userId}:`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Description: ${description}`);

    await interaction.reply({
      content: t(locale, "report.success_message"),
      flags: [MessageFlags.Ephemeral],
    });
  },
});
