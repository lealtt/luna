import { type ModalSubmitFields, type CacheType, Role, User, type Channel } from "discord.js";

/**
 * A handler class that provides fluent methods to extract typed values from a modal submission.
 * @private
 */
class ModalValueHandler {
  constructor(
    private fields: ModalSubmitFields<CacheType>,
    private customId: string,
  ) {}

  /**
   * Extracts the selected values from a StringSelectMenu.
   * @returns A readonly array of the selected string values.
   */
  strings(): readonly string[] {
    return this.fields.getStringSelectValues(this.customId);
  }

  /**
   * Extracts the selected users from a UserSelectMenu.
   * @returns An array of User objects.
   */
  users(): User[] {
    const users = this.fields.getSelectedUsers(this.customId);
    return users ? Array.from(users.values()).filter(Boolean) : [];
  }

  /**
   * Extracts the selected roles from a RoleSelectMenu.
   * @returns An array of Role objects.
   */
  roles(): Role[] {
    const roles = this.fields.getSelectedRoles(this.customId);
    return roles ? Array.from(roles.values()).filter((r): r is Role => r !== null) : [];
  }

  /**
   * Extracts the selected channels from a ChannelSelectMenu.
   * @returns An array of Channel objects.
   */
  channels(): Channel[] {
    const channels = this.fields.getSelectedChannels(this.customId);
    return (channels ? Array.from(channels.values()).filter(Boolean) : []) as Channel[];
  }

  /**
   * Extracts all selected users and roles from a MentionableSelectMenu.
   * @returns An array containing both User and Role objects.
   */
  mentionables(): (User | Role)[] {
    const mentionables = this.fields.getSelectedMentionables(this.customId);
    if (!mentionables) return [];

    const results: (User | Role)[] = [];

    Array.from(mentionables.users.values())
      .filter(Boolean)
      .forEach((u) => results.push(u));

    Array.from(mentionables.roles.values())
      .filter((r): r is Role => r !== null)
      .forEach((r) => results.push(r));

    return results;
  }
}

/**
 * A utility function that provides a fluent API to easily extract values from various select menus within a modal.
 *
 * @example
 * const users = modalValues(interaction.fields, 'user-select-id').users();
 * const roles = modalValues(interaction.fields, 'role-select-id').roles();
 *
 * @param fields The `interaction.fields` object from a modal submit interaction.
 * @param customId The `customId` of the select menu component you want to read from.
 * @returns A handler with methods like `.users()`, `.roles()`, etc., to extract the data.
 */
export function modalValues(
  fields: ModalSubmitFields<CacheType>,
  customId: string,
): ModalValueHandler {
  return new ModalValueHandler(fields, customId);
}
