import {
  type ModalSubmitInteraction,
  type ModalSubmitFields,
  type CacheType,
  User,
  Role,
  type Channel,
} from "discord.js";

// Supported field types and their outputs
interface FieldOutput {
  strings: readonly string[];
  users: User[];
  roles: Role[];
  channels: Channel[];
  mentionables: (User | Role)[];
  text: string;
}

// Maps field names to their type and customId
type ExtractorInput = Record<string, { type: keyof FieldOutput; customId: string }>;

// Extraction logic for each field type
const extractors: Record<
  keyof FieldOutput,
  (fields: ModalSubmitFields<CacheType>, customId: string) => FieldOutput[keyof FieldOutput]
> = {
  strings: (fields, customId) => fields.getStringSelectValues(customId) ?? [],
  users: (fields, customId) =>
    Array.from(fields.getSelectedUsers(customId)?.values() ?? []).filter(Boolean) as User[],
  roles: (fields, customId) =>
    Array.from(fields.getSelectedRoles(customId)?.values() ?? []).filter(
      (r): r is Role => r !== null,
    ),
  channels: (fields, customId) =>
    Array.from(fields.getSelectedChannels(customId)?.values() ?? []).filter(Boolean) as Channel[],
  mentionables: (fields, customId) => {
    const mentionables = fields.getSelectedMentionables(customId);
    if (!mentionables) return [];
    return [
      ...Array.from(mentionables.users.values()).filter(Boolean),
      ...Array.from(mentionables.roles.values()).filter((r): r is Role => r !== null),
    ] as (User | Role)[];
  },
  text: (fields, customId) => fields.getTextInputValue(customId) ?? "",
};

/**
 * Extracts values from a Discord modal interaction based on a field-to-type mapping.
 * Supports strings, users, roles, channels, mentionables, and text fields.
 *
 * @example
 * const { experience, motivation, roles } = modalValues(interaction, () => ({
 *   experience: { type: 'text', customId: 'staff-apply/experience' },
 *   motivation: { type: 'text', customId: 'staff-apply/motivation' },
 *   roles: { type: 'roles', customId: 'staff-apply/roles' },
 * }));
 * // Returns: { experience: string, motivation: string, roles: Role[] }
 *
 * @param interaction The modal submit interaction
 * @param extractor Function mapping field names to their types and customIds
 * @returns An object with extracted values matching the specified types
 * @throws Error if the interaction has no fields
 */
export function modalValues<T extends ExtractorInput>(
  interaction: ModalSubmitInteraction<CacheType>,
  extractor: (fields: ModalSubmitFields<CacheType>) => T,
): { [K in keyof T]: FieldOutput[T[K]["type"]] } {
  if (!interaction.fields) {
    throw new Error("Modal interaction has no fields");
  }

  const fields = interaction.fields as ModalSubmitFields<CacheType>;
  const fieldConfigs = extractor(fields);

  return Object.fromEntries(
    Object.entries(fieldConfigs).map(([key, { type, customId }]) => [
      key,
      extractors[type]?.(fields, customId) ?? [],
    ]),
  ) as { [K in keyof T]: FieldOutput[T[K]["type"]] };
}
