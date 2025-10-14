import { createComponent, ComponentInteractionType } from "#discord/modules";
import { modalValues, t } from "#utils";
import { MessageFlags } from "discord.js";

createComponent({
  customId: "staff-application-modal",
  type: ComponentInteractionType.Modal,
  cached: "cached",
  async run(interaction) {
    const { user, locale } = interaction;

    // Extract all values
    const { experience, motivation, availability } = modalValues(interaction, () => ({
      experience: { type: "text", customId: "staff-apply/experience" },
      motivation: { type: "text", customId: "staff-apply/motivation" },
      availability: { type: "strings", customId: "staff-apply/availability" },
    }));

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
