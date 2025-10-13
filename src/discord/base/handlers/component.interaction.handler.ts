import { MessageComponentInteraction, ModalSubmitInteraction, MessageFlags } from "discord.js";
import { ComponentInteractionType, componentRegistry, type AnyComponent } from "#discord/modules";
import { logger, t, type I18nKey } from "#utils";
import { z, ZodError } from "zod";

/**
 * Matches a dynamic custom ID pattern against an interaction's custom ID.
 * @param pattern The component's custom ID pattern (e.g., "user/{action}/{id}").
 * @param customId The interaction's custom ID.
 * @returns An object of extracted parameters, or null if it doesn't match.
 */
function matchCustomIdPattern(pattern: string, customId: string): Record<string, string> | null {
  const patternParts = pattern.split("/");
  const idParts = customId.split("/");

  if (patternParts.length !== idParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const idPart = idParts[i];

    if (patternPart.startsWith("{") && patternPart.endsWith("}")) {
      const paramName = patternPart.slice(1, -1);
      params[paramName] = idPart;
    } else if (patternPart !== idPart) {
      return null;
    }
  }

  return params;
}

/**
 * Maps a discord.js interaction to our custom ComponentInteractionType enum.
 * @param interaction The incoming interaction object.
 * @returns The corresponding enum type, or null if unknown.
 */
function getComponentType(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
): ComponentInteractionType | null {
  if (interaction.isModalSubmit()) return ComponentInteractionType.Modal;
  if (interaction.isButton()) return ComponentInteractionType.Button;
  if (interaction.isStringSelectMenu()) return ComponentInteractionType.StringSelect;
  if (interaction.isUserSelectMenu()) return ComponentInteractionType.UserSelect;
  if (interaction.isRoleSelectMenu()) return ComponentInteractionType.RoleSelect;
  if (interaction.isMentionableSelectMenu()) return ComponentInteractionType.MentionableSelect;
  if (interaction.isChannelSelectMenu()) return ComponentInteractionType.ChannelSelect;

  logger.warn(`Unknown interaction type for customId: ${interaction.customId}`);
  return null;
}

/**
 * Validates parameters against a Zod schema.
 * @param params Raw parameters extracted from the custom ID.
 * @param schema The Zod schema to validate against.
 * @returns The validated parameters.
 * @throws ZodError if validation fails.
 */
function validateParams(
  params: Record<string, string>,
  schema?: z.ZodObject<any>,
): Record<string, any> {
  if (!schema) return params;
  return schema.parse(params);
}

/**
 * Sends a standardized ephemeral error reply to an interaction.
 * @param interaction The component or modal interaction.
 * @param messageKey The i18n key for the error message.
 * @param variables Optional variables for the message.
 */
async function sendErrorReply(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  messageKey: I18nKey = "common_errors.generic",
  variables?: Record<string, string | number>,
): Promise<void> {
  await interaction.reply({
    content: t(interaction.locale, messageKey, variables),
    flags: [MessageFlags.Ephemeral],
  });
}

/**
 * Handles all incoming component and modal interactions.
 * @param interaction The incoming Discord.js interaction.
 */
export async function handleComponentInteraction(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
): Promise<void> {
  const interactionType = getComponentType(interaction);
  if (interactionType === null) {
    if (!interaction.replied && !interaction.deferred) {
      await sendErrorReply(interaction, "common_errors.unknown_interaction");
    }
    return;
  }

  const staticKey = interaction.customId.split("/")[0];
  if (!staticKey) return;

  const handlersForStaticKey = componentRegistry.get(staticKey);

  if (!handlersForStaticKey) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(`No matching handler found for base custom ID: ${staticKey}`);
      await sendErrorReply(interaction, "common_errors.no_handler");
    }
    return;
  }

  let handler: AnyComponent | undefined;
  let rawParams: Record<string, string> | null = null;

  for (const [pattern, componentHandler] of handlersForStaticKey.entries()) {
    rawParams = matchCustomIdPattern(pattern, interaction.customId);
    if (rawParams) {
      handler = componentHandler;
      break;
    }
  }

  if (!handler) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(`No specific handler found for custom ID: ${interaction.customId}`);
      await sendErrorReply(interaction, "common_errors.no_handler");
    }
    return;
  }

  const typeMatch = Array.isArray(handler.type)
    ? handler.type.includes(interactionType)
    : handler.type === interactionType;

  if (!typeMatch || !rawParams) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(
        `Handler found for "${staticKey}" but it did not match the full custom ID or interaction type.`,
      );
      await sendErrorReply(interaction, "common_errors.no_handler");
    }
    return;
  }

  try {
    const validatedParams = validateParams(rawParams, handler.paramsSchema);
    await (handler as AnyComponent).run(interaction as any, validatedParams);
  } catch (error) {
    if (!interaction.replied && !interaction.deferred) {
      if (error instanceof ZodError) {
        logger.error(`Zod validation error for "${handler.customId}":`, error.flatten());
        await sendErrorReply(interaction, "common_errors.invalid_params");
      } else {
        logger.error(`Error executing handler for "${handler.customId}":`, error);
        await sendErrorReply(interaction);
      }
    } else {
      logger.error(
        `An error occurred for "${handler.customId}" after a reply was already sent:`,
        error,
      );
    }
  }
}
