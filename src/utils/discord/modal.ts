import {
  type ModalSubmitInteraction,
  type ModalSubmitFields,
  type CacheType,
  type User,
  type Role,
  type Channel,
} from "discord.js";
import { logger } from "../system/logger.js";

/**
 * Extracts values from a Discord modal interaction based on a schema.
 * This provides a simple, type-safe way to get text inputs, selections, and more.
 *
 * @example
 * // Basic usage for text inputs
 * const { username, bio } = extractModalValues(interaction, {
 * username: "user-form/username",
 * bio: "user-form/bio"
 * });
 * // Returns: { username: string, bio: string }
 *
 * @example
 * // Usage with specific field types like roles and string selects
 * const { tags, roles } = extractModalValues(interaction, {
 * tags: ["staff-apply/tags", "strings"],
 * roles: ["staff-apply/roles", "roles"]
 * });
 * // Returns: { tags: string[], roles: Role[] }
 *
 * @param interaction The ModalSubmitInteraction to extract values from.
 * @param schema An object mapping field names to their customId or a [customId, type] tuple.
 * @returns An object with the extracted values, with types inferred from the schema.
 * @throws {Error} If the interaction has no fields.
 */
export function extractModalValues<
  const T extends Record<string, string | readonly [string, FieldType]>,
>(interaction: ModalSubmitInteraction<CacheType>, schema: T): ModalValuesOutput<T> {
  const fields = interaction.fields;

  if (!fields) {
    throw new Error("Modal fields not found");
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(schema)) {
    const [customId, type] = typeof value === "string" ? [value, "text" as const] : value;

    result[key] = extractField(fields, customId, type);
  }

  return result as ModalValuesOutput<T>;
}

type FieldType = "text" | "strings" | "users" | "roles" | "channels" | "mentionables";

type FieldTypeOutput = {
  text: string;
  strings: readonly string[];
  users: User[];
  roles: Role[];
  channels: Channel[];
  mentionables: (User | Role)[];
};

type ModalValuesOutput<T extends Record<string, string | readonly [string, FieldType]>> = {
  [K in keyof T]: T[K] extends readonly [string, infer Type extends FieldType]
    ? FieldTypeOutput[Type]
    : string;
};

function extractField(
  fields: ModalSubmitFields<CacheType>,
  customId: string,
  type: FieldType,
): any {
  try {
    switch (type) {
      case "text":
        return fields.getTextInputValue(customId) ?? "";

      case "strings":
        return fields.getStringSelectValues(customId) ?? [];

      case "users": {
        const users = fields.getSelectedUsers(customId);
        return users ? Array.from(users.values()).filter(Boolean) : [];
      }

      case "roles": {
        const roles = fields.getSelectedRoles(customId);
        return roles ? Array.from(roles.values()).filter((r): r is Role => r !== null) : [];
      }

      case "channels": {
        const channels = fields.getSelectedChannels(customId);
        return channels ? Array.from(channels.values()).filter(Boolean) : [];
      }

      case "mentionables": {
        const mentionables = fields.getSelectedMentionables(customId);
        if (!mentionables) return [];

        return [
          ...Array.from(mentionables.users.values()).filter(Boolean),
          ...Array.from(mentionables.roles.values()).filter((r): r is Role => r !== null),
        ];
      }

      default:
        return "";
    }
  } catch (error) {
    logger.error(error);
    if (type === "text") return "";
    return [];
  }
}
