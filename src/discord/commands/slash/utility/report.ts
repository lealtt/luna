import { createModal, createTextInput } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { t } from "#utils";
import { ApplicationCommandType, InteractionContextType, TextInputStyle } from "discord.js";

createCommand({
  name: "report",
  description: "Report a user or a bug.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  async run(interaction) {
    const { user, locale } = interaction;

    const subjectInput = createTextInput({
      label: t(locale, "report.subject_label"),
      customId: "report/subject",
      placeholder: t(locale, "report.subject_placeholder"),
      style: TextInputStyle.Short,
      maxLength: 100,
    });

    const descriptionInput = createTextInput({
      label: t(locale, "report.description_label"),
      customId: "report/description",
      placeholder: t(locale, "report.description_placeholder"),
      style: TextInputStyle.Paragraph,
      maxLength: 2000,
    });

    const reportModal = createModal({
      customId: `report/${user.id}`,
      title: t(locale, "report.modal_title"),
      components: [subjectInput, descriptionInput],
    });

    await interaction.showModal(reportModal);
  },
});
