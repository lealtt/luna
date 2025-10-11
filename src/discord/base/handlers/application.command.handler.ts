import {
  ApplicationCommandType,
  chatInputApplicationCommandMention,
  Collection,
  inlineCode,
  MessageFlags,
  time,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type MessageContextMenuCommandInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { runMiddlewareChain } from "#discord/base/middleware";
import { userLocaleState } from "#states";
import { logger, t, Timer } from "#utils";
import type { AnyCommand } from "#discord/registry";

// A type alias for any application command interaction.
type AnyApplicationCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

/**
 * Checks and handles the cooldown for any application command.
 * @param interaction The incoming application command interaction.
 * @param command The command to check the cooldown for.
 * @returns True if the user is on cooldown, false otherwise.
 */
async function handleCooldown(
  interaction: AnyApplicationCommandInteraction,
  command: AnyCommand,
): Promise<boolean> {
  const { cooldowns } = interaction.client;
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name)!;
  const cooldownAmount = (command.cooldown ?? 3) * 1000;
  const userTimestamp = timestamps.get(interaction.user.id);

  if (userTimestamp) {
    const expirationTime = userTimestamp + cooldownAmount;
    if (now < expirationTime) {
      const commandMentionFormatters: Partial<Record<ApplicationCommandType, () => string>> = {
        [ApplicationCommandType.ChatInput]: () =>
          chatInputApplicationCommandMention(command.name, interaction.commandId),
        [ApplicationCommandType.User]: () => inlineCode(command.name),
        [ApplicationCommandType.Message]: () => inlineCode(command.name),
      };

      const formatter = commandMentionFormatters[interaction.commandType];
      const commandMention = formatter ? formatter() : inlineCode(command.name);
      const timeLeft = time(Math.floor(expirationTime / 1000), "R");

      const cooldownReply: InteractionReplyOptions = {
        content: t(interaction.locale, "common_errors.cooldown", {
          command: commandMention,
          time: timeLeft,
        }),
        flags: MessageFlags.Ephemeral,
      };
      await interaction.reply(cooldownReply);
      return true;
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  return false;
}

/**
 * Handles incoming autocomplete interactions.
 * @param interaction The autocomplete interaction.
 */
export async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command || command.type !== ApplicationCommandType.ChatInput || !command.autocomplete) {
    return;
  }

  try {
    await command.autocomplete(interaction as AutocompleteInteraction<"cached">);
  } catch (error) {
    logger.error("Error in autocomplete handler:", error);
  }
}

/**
 * Handles the logic for executing any application command.
 * @param interaction The incoming application command interaction.
 */
export async function handleApplicationCommand(interaction: AnyApplicationCommandInteraction) {
  // Cache the user's locale for potential use in other parts of the bot (e.g., prefix commands in DMs).
  userLocaleState.set({ locale: interaction.locale }, Timer(1).hour());

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    logger.error(`No command matching "${interaction.commandName}" was found.`);
    return;
  }

  try {
    if (await handleCooldown(interaction, command)) return;

    const finalHandler = () => command.run(interaction as any);
    const middlewares = command.middlewares ?? [];

    await runMiddlewareChain(interaction, middlewares as any, finalHandler);
  } catch (error) {
    logger.error(`Error executing command "${command.name}":`, error);

    const errorReply: InteractionReplyOptions = {
      content: t(interaction.locale, "common_errors.generic"),
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
}
