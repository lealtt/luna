import { MessageComponentInteraction, ModalSubmitInteraction, MessageFlags } from "discord.js";
import { logger } from "#utils";
import { z, ZodError } from "zod";
import { componentRegistry } from "./component.module.js";
import {
  ComponentInteractionType,
  type AnyComponent,
  type AnyInteraction,
} from "./component.types.js";
import { t } from "#translate";

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

function validateParams(
  params: Record<string, string>,
  schema?: z.ZodObject<any>,
): Record<string, any> {
  if (!schema) return params;
  return schema.parse(params);
}

export async function handleComponentInteraction(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
): Promise<void> {
  const interactionType = getComponentType(interaction);
  if (interactionType === null) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: t("common_errors.unknown_interaction"),
        flags: [MessageFlags.Ephemeral],
      });
    }
    return;
  }

  const staticKey = interaction.customId.split("/")[0];
  if (!staticKey) return;

  const handlersForStaticKey = componentRegistry.getHandlerMap(staticKey);

  if (!handlersForStaticKey) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(`No matching handler found for base custom ID: ${staticKey}`);
      await interaction.reply({
        content: t("common_errors.no_handler"),
        flags: [MessageFlags.Ephemeral],
      });
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
      await interaction.reply({
        content: t("common_errors.no_handler"),
        flags: [MessageFlags.Ephemeral],
      });
    }
    return;
  }

  if (handler.type !== interactionType) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(
        `Handler type mismatch for "${handler.customId}". Expected ${ComponentInteractionType[interactionType]}, got ${ComponentInteractionType[handler.type]}.`,
      );
      await interaction.reply({
        content: t("common_errors.no_handler"),
        flags: [MessageFlags.Ephemeral],
      });
    }
    return;
  }
  if (!rawParams) {
    if (!interaction.replied && !interaction.deferred) {
      logger.error(
        `Internal error: Params became null unexpectedly for custom ID: ${interaction.customId}`,
      );
      await interaction.reply({
        content: t("common_errors.generic"),
        flags: [MessageFlags.Ephemeral],
      });
    }
    return;
  }

  try {
    const validatedParams = validateParams(rawParams, handler.paramsSchema);

    await handler.run(interaction as AnyInteraction, validatedParams);
  } catch (error) {
    if (!interaction.replied && !interaction.deferred) {
      if (error instanceof ZodError) {
        logger.error(`Zod validation error for "${handler.customId}":`, error.flatten());
        await interaction.reply({
          content: t("common_errors.invalid_params"),
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        logger.error(`Error executing handler for "${handler.customId}":`, error);
        await interaction.reply({
          content: t("common_errors.generic"),
          flags: [MessageFlags.Ephemeral],
        });
      }
    } else {
      logger.error(
        `An error occurred for "${handler.customId}" after a reply was already sent:`,
        error,
      );
    }
  }
}
