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
import { runMiddlewareChain } from "#discord/modules";
import { userLocaleState } from "#states";
import { logger, t, Timer, type I18nKey } from "#utils";

// Type alias for any application command interaction
type AnyApplicationCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

// Interface for commands
interface Command {
  name: string;
  type: ApplicationCommandType;
  cooldown?: number;
  middlewares?: Array<
    (interaction: AnyApplicationCommandInteraction, next: () => Promise<void>) => Promise<void>
  >;
  run: (interaction: AnyApplicationCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction<"cached">) => Promise<void>;
}

interface ExtendedClient {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, number>>;
}

/**
 * Formats a command mention based on its type.
 * @param command - The command to format.
 * @param commandId - The command ID for chat input commands.
 * @returns Formatted command mention string.
 */
function formatCommandMention(command: Command, commandId: string): string {
  const formatters: Partial<Record<ApplicationCommandType, () => string>> = {
    [ApplicationCommandType.ChatInput]: () =>
      chatInputApplicationCommandMention(command.name, commandId),
    [ApplicationCommandType.User]: () => inlineCode(command.name),
    [ApplicationCommandType.Message]: () => inlineCode(command.name),
  };
  return formatters[command.type]?.() ?? inlineCode(command.name);
}

/**
 * Checks if a user is on cooldown for a command and replies if they are.
 * @param interaction - The command interaction.
 * @param command - The command to check.
 * @returns True if the user is on cooldown, false otherwise.
 */
async function checkCooldown(
  interaction: AnyApplicationCommandInteraction,
  command: Command,
): Promise<boolean> {
  const client = interaction.client as ExtendedClient;
  const cooldowns = client.cooldowns;

  // Initialize cooldown collection for the command if it doesn't exist
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const timestamps = cooldowns.get(command.name)!;
  const now = Date.now();
  const cooldownAmount = (command.cooldown ?? 3) * 1000; // Default to 3 seconds
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

  // Set new timestamp and schedule cleanup
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  return false;
}

/**
 * Sends an error reply to the user, handling both replied and unreplied states.
 * @param interaction - The command interaction.
 * @param messageKey - The i18n key for the error message.
 * @param variables - Optional variables for the error message.
 */
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

/**
 * Handles autocomplete interactions for chat input commands.
 * @param interaction - The autocomplete interaction.
 */
export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const client = interaction.client as ExtendedClient;
  const command = client.commands.get(interaction.commandName);

  if (!command || command.type !== ApplicationCommandType.ChatInput || !command.autocomplete) {
    logger.warn(`No valid autocomplete handler for command "${interaction.commandName}"`);
    return;
  }

  try {
    await command.autocomplete(interaction as AutocompleteInteraction<"cached">);
  } catch (error) {
    logger.error(`Autocomplete error for "${interaction.commandName}":`, error);
  }
}

/**
 * Handles execution of any application command, including middleware and cooldowns.
 * @param interaction - The incoming command interaction.
 */
export async function handleApplicationCommand(
  interaction: AnyApplicationCommandInteraction,
): Promise<void> {
  // Cache user's locale for use elsewhere
  userLocaleState.set({ locale: interaction.locale }, Timer(1).hour());

  const client = interaction.client as ExtendedClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`Command "${interaction.commandName}" not found.`);
    await sendErrorReply(interaction);
    return;
  }

  try {
    // Check cooldown
    if (await checkCooldown(interaction, command)) {
      return;
    }

    // Run middleware chain and execute command
    const executeCommand = () => command.run(interaction);
    await runMiddlewareChain(interaction, command.middlewares ?? [], executeCommand);
  } catch (error) {
    logger.error(`Error executing command "${command.name}":`, error);
    await sendErrorReply(interaction);
  }
}
