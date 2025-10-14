import {
  ApplicationCommandType,
  chatInputApplicationCommandMention,
  Collection,
  inlineCode,
  InteractionContextType,
  MessageFlags,
  time,
  type AutocompleteInteraction,
  type CacheType,
  type InteractionReplyOptions,
} from "discord.js";
import { autocompleteRegistry, commandRegistry } from "./command.module.js";
import { runMiddlewareChain } from "../shared/middleware.module.js";
import { userLocaleState } from "#states";
import { logger, t, Timer, type I18nKey } from "#utils";
import type { AnyApplicationCommandInteraction, StorableCommand } from "./command.types.js";

function formatCommandMention(command: StorableCommand, commandId: string): string {
  const formatters: Partial<Record<ApplicationCommandType, () => string>> = {
    [ApplicationCommandType.ChatInput]: () =>
      chatInputApplicationCommandMention(command.name, commandId),
    [ApplicationCommandType.User]: () => inlineCode(command.name),
    [ApplicationCommandType.Message]: () => inlineCode(command.name),
  };
  return formatters[command.type]?.() ?? inlineCode(command.name);
}

async function checkCooldown(
  interaction: AnyApplicationCommandInteraction,
  command: StorableCommand,
): Promise<boolean> {
  const client = interaction.client;
  const cooldowns = client.cooldowns;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const timestamps = cooldowns.get(command.name)!;
  const now = Date.now();
  const cooldownAmount = (command.cooldown ?? 3) * 1000;
  const userTimestamp = timestamps.get(interaction.user.id);

  if (userTimestamp && now < userTimestamp + cooldownAmount) {
    const expirationTime = Math.floor((userTimestamp + cooldownAmount) / 1000);
    const reply: InteractionReplyOptions = {
      content: t(interaction.locale, "common_errors.cooldown", {
        command: formatCommandMention(command, interaction.commandId),
        time: time(expirationTime, "R"),
      }),
      flags: MessageFlags.Ephemeral,
    };
    await interaction.reply(reply);
    return true;
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  return false;
}

async function sendErrorReply(
  interaction: AnyApplicationCommandInteraction,
  messageKey: I18nKey = "common_errors.generic",
  variables?: Record<string, string | number>,
): Promise<void> {
  const reply: InteractionReplyOptions = {
    content: t(interaction.locale, messageKey, variables),
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(reply);
  } else {
    await interaction.reply(reply);
  }
}

type AnyAutocompleteHandler = (
  interaction: AutocompleteInteraction<CacheType>,
) => Promise<void> | void;

export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const command = commandRegistry.get(interaction.commandName);
  if (!command) return;

  const commandHandlers = autocompleteRegistry.get(interaction.commandName);
  if (!commandHandlers) return;

  const focusedOption = interaction.options.getFocused(true);

  const handler = commandHandlers.get(focusedOption.name) as AnyAutocompleteHandler | undefined;

  if (!handler) {
    logger.warn(
      `No autocomplete handler found for option "${focusedOption.name}" in command "${interaction.commandName}"`,
    );
    return;
  }

  try {
    const commandWithContexts = command as { contexts?: readonly InteractionContextType[] };
    const isGuildOnly =
      commandWithContexts.contexts?.length === 1 &&
      commandWithContexts.contexts[0] === InteractionContextType.Guild;

    await handler(isGuildOnly ? (interaction as AutocompleteInteraction<"cached">) : interaction);
  } catch (error) {
    logger.error(
      `Autocomplete error for "${interaction.commandName}:${focusedOption.name}":`,
      error,
    );
  }
}

export async function handleApplicationCommand(
  interaction: AnyApplicationCommandInteraction,
): Promise<void> {
  userLocaleState.set({ locale: interaction.locale }, Timer(1).hour());

  const client = interaction.client;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`Command "${interaction.commandName}" not found.`);
    await sendErrorReply(interaction);
    return;
  }

  try {
    if (await checkCooldown(interaction, command)) {
      return;
    }

    const executeCommand = () => command.run(interaction);
    await runMiddlewareChain(interaction, command.middlewares ?? [], executeCommand);
  } catch (error) {
    logger.error(`Error executing command "${command.name}":`, error);
    await sendErrorReply(interaction);
  }
}
