import { createComponent } from "#discord/creators";
import { ComponentInteractionType } from "#discord/registry";
import { t } from "#utils";
import { MessageFlags } from "discord.js";

createComponent({
  customId: "staff-application-modal",
  type: ComponentInteractionType.Modal,
  async run(interaction) {
    const { fields, user, locale } = interaction;

    // Extract the values from each component by its customId
    const experience = fields.getTextInputValue("staff-apply/experience");
    const motivation = fields.getTextInputValue("staff-apply/motivation");
    const [availability] = fields.getStringSelectValues("staff-apply/availability");

    console.log(`New Staff Application from ${user.displayName} (${user.id}):`);
    console.log(`- Experience: ${experience}`);
    console.log(`- Motivation: ${motivation}`);
    console.log(`- Availability: ${availability}`);

    await interaction.reply({
      content: t(locale, "staff_apply.success_message"),
      flags: MessageFlags.Ephemeral,
    });
  },
});
