import {
  createLabel,
  createModal,
  createStringSelectMenu,
  createTextInput,
  createTextDisplay,
} from "#discord/builders";
import { createCommand } from "#discord/creators";
import { t } from "#utils";
import { ApplicationCommandType, InteractionContextType, TextInputStyle } from "discord.js";

createCommand({
  name: "form",
  description: "Apply to become a staff member.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  run(interaction) {
    const { locale } = interaction;

    const instructionsText = createTextDisplay({
      content: t(locale, "staff_apply.modal_instructions"),
    });

    const experienceInput = createTextInput({
      label: t(locale, "staff_apply.experience_label"),
      customId: "staff-apply/experience",
      style: TextInputStyle.Paragraph,
      placeholder: t(locale, "staff_apply.experience_placeholder"),
      required: true,
    });

    const motivationInput = createTextInput({
      label: t(locale, "staff_apply.motivation_label"),
      customId: "staff-apply/motivation",
      style: TextInputStyle.Paragraph,
      placeholder: t(locale, "staff_apply.motivation_placeholder"),
      required: true,
    });

    const availabilityLabel = createLabel({
      label: t(locale, "staff_apply.availability_label"),
      component: createStringSelectMenu({
        customId: "staff-apply/availability",
        placeholder: t(locale, "staff_apply.availability_placeholder"),
        options: [
          {
            label: t(locale, "staff_apply.availability_options.mornings"),
            value: "weekdays_mornings",
          },
          {
            label: t(locale, "staff_apply.availability_options.afternoons"),
            value: "weekdays_afternoons",
          },
          {
            label: t(locale, "staff_apply.availability_options.evenings"),
            value: "weekdays_evenings",
          },
          {
            label: t(locale, "staff_apply.availability_options.weekends"),
            value: "weekends_full",
          },
          {
            label: t(locale, "staff_apply.availability_options.flexible"),
            value: "flexible",
          },
        ],
      }),
    });

    const staffApplicationModal = createModal({
      customId: "staff-application-modal",
      title: t(locale, "staff_apply.modal_title"),
      components: [instructionsText, experienceInput, motivationInput, availabilityLabel],
    });

    interaction.showModal(staffApplicationModal);
  },
});
