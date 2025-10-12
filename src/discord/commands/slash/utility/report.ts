import { createModal, createTextInput } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { ApplicationCommandType, InteractionContextType, TextInputStyle } from "discord.js";

createCommand({
  name: "report",
  description: "Report a user or a bug.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { user, locale } = interaction;

    const subjectInput = createTextInput({
      locale,
      labelI18nKey: "report.subject_label",
      customId: "report/subject",
      placeholderI18nKey: "report.subject_placeholder",
      style: TextInputStyle.Short,
      maxLength: 100,
      required: true,
    });

    const descriptionInput = createTextInput({
      locale,
      labelI18nKey: "report.description_label",
      customId: "report/description",
      placeholderI18nKey: "report.description_placeholder",
      style: TextInputStyle.Paragraph,
      maxLength: 2000,
      required: true,
    });

    const reportModal = createModal({
      locale,
      customId: `report/${user.id}`,
      titleI18nKey: "report.modal_title",
      components: [subjectInput, descriptionInput],
    });

    await interaction.showModal(reportModal);
  },
});
