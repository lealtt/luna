import type { Middleware } from "#discord/base/middleware";
import { t } from "#utils";
import { type Message, type PermissionsString } from "discord.js";

/**
 * A factory that creates a middleware to check if a member has the required server-wide permissions.
 * @param permissions A list of permissions required to run the command.
 * @returns A middleware function that performs the check.
 */
export function checkPermissions(...permissions: PermissionsString[]): Middleware<Message> {
  return async (message, next) => {
    const { locale } = message;

    // Ensure the command is being run within a server.
    if (!message.inGuild()) {
      await message.reply(t(locale, "common_errors.guild_only"));
      return;
    }

    // Get the member's server-wide permissions.
    const memberPermissions = message.member!.permissions;
    const missingPermissions = permissions.filter((perm) => !memberPermissions.has(perm));

    // If there are any missing permissions, reply with an error and stop execution.
    if (missingPermissions.length > 0) {
      await message.reply({
        content: t(locale, "common_errors.missing_permissions", {
          permissions: missingPermissions.join("`, `"),
        }),
      });
      return;
    }

    // If all permissions are present, continue to the next middleware or the command itself.
    await next();
  };
}
