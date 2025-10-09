import {
  type ChatInputCommandInteraction,
  inlineCode,
  Message,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { createLogMiddleware } from "./log.factory.js";

/**
 * Middleware to log the execution of a Chat Input (slash) command.
 */
export const logChatInput = createLogMiddleware<ChatInputCommandInteraction>((interaction) => {
  // The handler only extracts the 'options' from the interaction.
  return interaction.options.data
    .map((opt) => `${inlineCode(opt.name)}: ${inlineCode(String(opt.value))}`)
    .join("\n");
});

/**
 * Middleware to log the execution of a User Context Menu command.
 */
export const logUserContext = createLogMiddleware<UserContextMenuCommandInteraction>(
  // The handler extracts the target user.
  (interaction) =>
    `Target User: ${interaction.targetUser} (${inlineCode(interaction.targetUser.id)})`,
);

/**
 * Middleware to log the execution of a Message Context Menu command.
 */
export const logMessageContext = createLogMiddleware<MessageContextMenuCommandInteraction>(
  // The handler extracts the target message ID.
  (interaction) => `Target Message ID: ${inlineCode(interaction.targetMessage.id)}`,
);

/**
 * Middleware to log the execution of a prefix command.
 */
export const logPrefixCommand = createLogMiddleware<Message>((message) => {
  // The handler extracts the arguments from the message.
  return message.content
    .split(/ +/)
    .slice(1)
    .map((arg) => inlineCode(arg))
    .join(" ");
});
