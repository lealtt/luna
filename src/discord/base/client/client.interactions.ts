import {
  Collection,
  Events,
  MessageFlags,
  chatInputApplicationCommandMention,
  time,
  type InteractionReplyOptions,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
  InteractionType,
  ApplicationCommandType,
  type UserContextMenuCommandInteraction,
  type MessageContextMenuCommandInteraction,
  type AutocompleteInteraction,
  inlineCode,
} from "discord.js";
import { ComponentInteractionType, componentRegistry, type AnyCommand } from "#discord/registry";
import { logger, Timer, t } from "#utils";
import { createEvent } from "#discord/creators";
import { runMiddlewareChain } from "#discord/base/middleware";
import { userLocaleState } from "#states";

/**
 * A type alias for any application command interaction.
 */
type AnyApplicationCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

/**
 * Handles incoming autocomplete interactions.
 */
async function handleAutocomplete(interaction: AutocompleteInteraction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command || command.type !== ApplicationCommandType.ChatInput) return;

  if (command.autocomplete) {
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error(error);
    }
  }
}

/**
 * Checks and handles the cooldown for any application command.
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
 * Handles the logic for executing any application command.
 */
async function handleApplicationCommand(interaction: AnyApplicationCommandInteraction) {
  // Caches the user's client language from the interaction.
  // This is useful as a fallback for prefix commands in DMs.
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
    logger.error(error);

    const errorReply: InteractionReplyOptions = {
      content: t(interaction.locale, "common_errors.generic"),
      flags: MessageFlags.Ephemeral,
    };

    await (interaction.replied || interaction.deferred
      ? interaction.followUp(errorReply)
      : interaction.reply(errorReply));
  }
}

/**
 * Matches a dynamic custom ID pattern against an interaction's custom ID.
 */
function matchAndGetParams(
  componentCustomId: string,
  interactionCustomId: string,
): Record<string, string> | null {
  const patternParts = componentCustomId.split("/");
  const interactionParts = interactionCustomId.split("/");

  if (patternParts.length !== interactionParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const interactionPart = interactionParts[i];

    if (patternPart.startsWith("{") && patternPart.endsWith("}")) {
      params[patternPart.slice(1, -1)] = interactionPart;
    } else if (patternPart !== interactionPart) {
      return null;
    }
  }

  return params;
}

/**
 * Maps discord.js ComponentType to our custom ComponentInteractionType enum.
 */
function getInteractionType(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
): ComponentInteractionType | null {
  if (interaction.isModalSubmit()) return ComponentInteractionType.Modal;
  if (interaction.isButton()) return ComponentInteractionType.Button;
  if (interaction.isStringSelectMenu()) return ComponentInteractionType.StringSelect;
  if (interaction.isUserSelectMenu()) return ComponentInteractionType.UserSelect;
  if (interaction.isRoleSelectMenu()) return ComponentInteractionType.RoleSelect;
  if (interaction.isMentionableSelectMenu()) return ComponentInteractionType.MentionableSelect;
  if (interaction.isChannelSelectMenu()) return ComponentInteractionType.ChannelSelect;
  return null;
}

/**
 * Finds and executes the appropriate component handler based on custom ID matching.
 */
async function handleComponent(interaction: MessageComponentInteraction | ModalSubmitInteraction) {
  const interactionType = getInteractionType(interaction);
  if (interactionType === null) return;

  for (const component of componentRegistry.values()) {
    const typeMatch = Array.isArray(component.type)
      ? component.type.includes(interactionType)
      : component.type === interactionType;

    if (!typeMatch) continue;

    const params = matchAndGetParams(component.customId, interaction.customId);
    if (params) {
      try {
        await component.run(interaction as any, params);
      } catch (error) {
        logger.error(error);
      }
      return;
    }
  }
}

createEvent({
  name: Events.InteractionCreate,
  async run(interaction) {
    interaction.locale = interaction.guild?.preferredLocale ?? interaction.locale;

    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        if (
          interaction.isChatInputCommand() ||
          interaction.isUserContextMenuCommand() ||
          interaction.isMessageContextMenuCommand()
        ) {
          await handleApplicationCommand(interaction);
        }
        break;

      case InteractionType.ApplicationCommandAutocomplete:
        await handleAutocomplete(interaction);
        break;

      case InteractionType.MessageComponent:
      case InteractionType.ModalSubmit:
        await handleComponent(interaction);
        break;
    }
  },
});
