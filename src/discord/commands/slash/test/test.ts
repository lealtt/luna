import { ComponentInteractionType, createCommand, createComponent } from "#discord/modules";
import {
  createLabel,
  createModal,
  createStringSelectMenu,
  createUserSelectMenu,
  createRoleSelectMenu,
  createChannelSelectMenu,
  createMentionableSelectMenu,
} from "#discord/builders";
import {
  ApplicationCommandType,
  channelMention,
  InteractionContextType,
  MessageFlags,
} from "discord.js";
import { logger, modalValues } from "#utils";

createCommand({
  name: "test",
  description: "Displays a modal with all types of select menus.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  run(interaction) {
    const stringSelect = createStringSelectMenu({
      customId: "test/string-select",
      placeholder: "Choose a string option",
      options: [
        { label: "Option 1", value: "option-1" },
        { label: "Option 2", value: "option-2" },
      ],
    });

    const userSelect = createUserSelectMenu({
      customId: "test/user-select",
      placeholder: "Select a user",
    });

    const roleSelect = createRoleSelectMenu({
      customId: "test/role-select",
      placeholder: "Select a role",
    });

    const channelSelect = createChannelSelectMenu({
      customId: "test/channel-select",
      placeholder: "Select a channel",
    });

    const mentionableSelect = createMentionableSelectMenu({
      customId: "test/mentionable-select",
      placeholder: "Select a user or a role",
    });

    const stringLabel = createLabel({
      label: "String Select Menu",
      description: "Select a predefined string value.",
      component: stringSelect,
    });

    const userLabel = createLabel({
      label: "User Select Menu",
      description: "Select a member from this server.",
      component: userSelect,
    });

    const roleLabel = createLabel({
      label: "Role Select Menu",
      description: "Select a role from this server.",
      component: roleSelect,
    });

    const channelLabel = createLabel({
      label: "Channel Select Menu",
      description: "Select a channel from this server.",
      component: channelSelect,
    });

    const mentionableLabel = createLabel({
      label: "Mentionable Select Menu",
      description: "Select a user or a role.",
      component: mentionableSelect,
    });

    const testModal = createModal({
      customId: "test-menus-modal",
      title: "All Select Menus Test",
      components: [stringLabel, userLabel, roleLabel, channelLabel, mentionableLabel],
    });

    interaction.showModal(testModal);
  },
});

createComponent({
  customId: "test-menus-modal",
  type: ComponentInteractionType.Modal,
  cached: "cached",
  async run(interaction) {
    const { fields } = interaction;

    const strings = modalValues(fields, "test/string-select").strings();
    const users = modalValues(fields, "test/user-select").users();
    const roles = modalValues(fields, "test/role-select").roles();
    const channels = modalValues(fields, "test/channel-select").channels();
    const mentionables = modalValues(fields, "test/mentionable-select").mentionables();

    const stringValue = strings.join(", ") || "None";
    const userValue = users.map((u) => u.toString()).join(", ") || "None";
    const roleValue = roles.map((r) => r.toString()).join(", ") || "None";
    const channelValue = channels.map((c) => channelMention(c.id)).join(", ") || "None";
    const mentionableValue = mentionables.map((m) => m.toString()).join(", ") || "None";

    const replyMessage = `
      **Submission Received!**
      - String: ${stringValue}
      - User: ${userValue}
      - Role: ${roleValue}
      - Channel: ${channelValue}
      - Mentionable: ${mentionableValue}
    `;

    logger.info("Test modal submitted.", {
      strings,
      users,
      roles,
      channels,
      mentionables,
    });

    await interaction.reply({
      content: replyMessage,
      flags: MessageFlags.Ephemeral,
    });
  },
});
