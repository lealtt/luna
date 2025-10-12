import {
  createLabel,
  createModal,
  createStringSelectMenu,
  createTextDisplay,
  createTextInput,
} from "#discord/builders";
import { createCommand } from "#discord/modules";
import { ApplicationCommandType, InteractionContextType, TextInputStyle } from "discord.js";

createCommand({
  name: "form",
  description: "Apply to become a staff member.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { locale } = interaction;

    const instructionsText = createTextDisplay({
      locale,
      i18nKey: "staff_apply.modal_instructions",
    });

    const experienceInput = createTextInput({
      locale,
      labelI18nKey: "staff_apply.experience_label",
      customId: "staff-apply/experience",
      style: TextInputStyle.Paragraph,
      placeholderI18nKey: "staff_apply.experience_placeholder",
      required: true,
    });

    const motivationInput = createTextInput({
      locale,
      labelI18nKey: "staff_apply.motivation_label",
      customId: "staff-apply/motivation",
      style: TextInputStyle.Paragraph,
      placeholderI18nKey: "staff_apply.motivation_placeholder",
      required: true,
    });

    const availabilityLabel = createLabel({
      locale: locale,
      i18nKey: "staff_apply.availability_label",
      component: createStringSelectMenu({
        locale,
        customId: "staff-apply/availability",
        placeholderI18nKey: "staff_apply.availability_placeholder",
        required: true,
        options: [
          {
            labelI18nKey: "staff_apply.availability_options.mornings",
            value: "weekdays_mornings",
          },
          {
            labelI18nKey: "staff_apply.availability_options.afternoons",
            value: "weekdays_afternoons",
          },
          {
            labelI18nKey: "staff_apply.availability_options.evenings",
            value: "weekdays_evenings",
          },
          { labelI18nKey: "staff_apply.availability_options.weekends", value: "weekends_full" },
          { labelI18nKey: "staff_apply.availability_options.flexible", value: "flexible" },
        ],
      }),
    });

    const staffApplicationModal = createModal({
      locale,
      customId: "staff-application-modal",
      titleI18nKey: "staff_apply.modal_title",
      components: [instructionsText, experienceInput, motivationInput, availabilityLabel],
    });

    await interaction.showModal(staffApplicationModal);
  },
});
