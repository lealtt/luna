import type { Middleware } from "#discord/modules";
import { t } from "#utils";
import { PermissionFlagsBits, type Message, type PermissionsString } from "discord.js";

/**
 * A factory that creates a middleware to check if a member has the required server-wide permissions.
 * @param permissions A list of permissions required to run the command, which can be strings or bigints from PermissionFlagsBits.
 * @returns A middleware function that performs the check.
 */
export function checkPermissions(
  ...permissions: (PermissionsString | bigint)[]
): Middleware<Message> {
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
      // Convert any bigints to string names for the error message
      const missingPermissionsNames = missingPermissions.map((p) =>
        typeof p === "bigint"
          ? Object.keys(PermissionFlagsBits).find(
              (key) => PermissionFlagsBits[key as keyof typeof PermissionFlagsBits] === p,
            ) || String(p)
          : p,
      );

      await message.reply({
        content: t(locale, "common_errors.missing_permissions", {
          permissions: missingPermissionsNames.join("`, `"),
        }),
      });
      return;
    }

    // If all permissions are present, continue to the next middleware or the command itself.
    await next();
  };
}
