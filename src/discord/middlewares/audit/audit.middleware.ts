import {
  type ChatInputCommandInteraction,
  inlineCode,
  Message,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { createAuditMiddleware } from "./audit.factory.js";

/**
 * Middleware to audit the execution of a Chat Input (slash) command.
 */
export const auditChatInput = createAuditMiddleware<ChatInputCommandInteraction>((interaction) => {
  return interaction.options.data
    .map((opt) => `${inlineCode(opt.name)}: ${inlineCode(String(opt.value))}`)
    .join("\n");
});

/**
 * Middleware to audit the execution of a User Context Menu command.
 */
export const auditUserContext = createAuditMiddleware<UserContextMenuCommandInteraction>(
  (interaction) =>
    `Target User: ${interaction.targetUser} (${inlineCode(interaction.targetUser.id)})`,
);

/**
 * Middleware to audit the execution of a Message Context Menu command.
 */
export const auditMessageContext = createAuditMiddleware<MessageContextMenuCommandInteraction>(
  (interaction) => `Target Message ID: ${inlineCode(interaction.targetMessage.id)}`,
);

/**
 * Middleware to audit the execution of a prefix command.
 */
export const auditPrefixCommand = createAuditMiddleware<Message>((message) => {
  return message.content
    .split(/ +/)
    .slice(1)
    .map((arg) => inlineCode(arg))
    .join(" ");
});
