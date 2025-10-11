import {
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
  MessageFlags,
} from "discord.js";
import { ComponentInteractionType, componentRegistry } from "#discord/registry";
import { logger, t } from "#utils";

/**
 * Matches a dynamic custom ID pattern against an interaction's custom ID.
 * Example: "user/{action}/{id}" matches "user/ban/12345"
 * @param componentCustomId The pattern from the component registry.
 * @param interactionCustomId The custom ID from the interaction.
 * @returns A record of the extracted parameters, or null if it doesn't match.
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
      // This is a dynamic part, extract the value
      params[patternPart.slice(1, -1)] = interactionPart;
    } else if (patternPart !== interactionPart) {
      // This is a static part, it must match exactly
      return null;
    }
  }

  return params;
}

/**
 * Maps a discord.js interaction to our custom ComponentInteractionType enum.
 * @param interaction The incoming interaction.
 * @returns The corresponding enum type, or null if unknown.
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
 * @param interaction The incoming component or modal interaction.
 */
export async function handleComponent(
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
) {
  const interactionType = getInteractionType(interaction);
  if (interactionType === null) return;

  for (const component of componentRegistry.values()) {
    // Check if the component's type matches the interaction's type
    const typeMatch = Array.isArray(component.type)
      ? component.type.includes(interactionType)
      : component.type === interactionType;

    if (!typeMatch) continue;

    const rawParams = matchAndGetParams(component.customId, interaction.customId);
    if (rawParams) {
      try {
        let finalParams: any = rawParams;

        // If a Zod schema is defined, validate the parameters
        if (component.paramsSchema) {
          const validation = component.paramsSchema.safeParse(rawParams);
          if (!validation.success) {
            logger.error(`Zod validation failed for component "${component.customId}":`);
            validation.error.issues.forEach((issue) => {
              logger.error(`  - Path: ${issue.path.join(".")}, Message: ${issue.message}`);
            });
            await interaction.reply({
              content: t(interaction.locale, "common_errors.generic"),
              flags: MessageFlags.Ephemeral,
            });
            return; // Stop execution on validation failure
          }
          finalParams = validation.data;
        }

        await component.run(interaction as any, finalParams);
      } catch (error) {
        logger.error(error);
      }
      return; // Stop searching once a match is found and executed
    }
  }
}
