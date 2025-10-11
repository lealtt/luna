import { createPrefixCommand } from "#discord/creators";
import { PermissionFlagsBits, inlineCode } from "discord.js";
import { z } from "zod";
import { t } from "#utils";

const guildTags = new Map<string, Map<string, { content: string; authorId: string }>>();

const TagFlagsSchema = z.object({
  create: z.string().optional(),
  delete: z.string().optional(),
  list: z.preprocess((val) => val === "true", z.boolean()).optional(),
  content: z.string().optional(),
  name: z.string().optional(),
});

createPrefixCommand({
  name: "tag",
  aliases: ["t"],
  flags: {
    schema: TagFlagsSchema,
    config: {
      // Define aliases and separators for each flag.
      create: {
        aliases: ["c"],
      },
      delete: {
        aliases: ["d"],
      },
      list: {
        aliases: ["l"],
      },
      content: {
        aliases: ["cont"],
        separator: ":",
      },
      name: {
        separator: ":",
      },
    },
  },
  async run(message, flags) {
    // This command must be run in a server.
    if (!message.inGuild()) {
      message.reply(t(message.locale, "common_errors.guild_only"));
      return;
    }

    const { locale, guild, author, member } = message;
    const { create, delete: del, list, content, name } = flags;

    // Ensure the guild has an entry in our main Map.
    if (!guildTags.has(guild.id)) {
      guildTags.set(guild.id, new Map());
    }
    const tags = guildTags.get(guild.id)!;

    // Logic for the 'create' action.
    if (create) {
      const tagName = create.toLowerCase();
      if (!content) {
        message.reply(t(locale, "tag.create_missing_args"));
        return;
      }
      if (tags.has(tagName)) {
        message.reply(t(locale, "tag.already_exists", { name: tagName }));
        return;
      }
      tags.set(tagName, { content, authorId: author.id });
      message.reply(t(locale, "tag.create_success", { name: tagName }));
      return;
    }

    // Logic for the 'delete' action.
    if (del) {
      const tagName = del.toLowerCase();
      const tag = tags.get(tagName);
      if (!tag) {
        message.reply(t(locale, "tag.not_found", { name: tagName }));
        return;
      }
      const canDelete =
        tag.authorId === author.id || member?.permissions.has(PermissionFlagsBits.ManageMessages);
      if (!canDelete) {
        message.reply(t(locale, "tag.delete_no_perms"));
        return;
      }
      tags.delete(tagName);
      message.reply(t(locale, "tag.delete_success", { name: tagName }));
      return;
    }

    // Logic for the 'list' action.
    if (list) {
      if (tags.size === 0) {
        message.reply(t(locale, "tag.list_empty"));
        return;
      }
      const tagNames = Array.from(tags.keys())
        .sort()
        .map((n) => inlineCode(n))
        .join(", ");
      message.reply(t(locale, "tag.list_all", { list: tagNames }));
      return;
    }

    // Default action: show a tag if a name is provided.
    const tagNameToShow = name ?? message.content.split(/ +/)[1];
    if (tagNameToShow) {
      const tag = tags.get(tagNameToShow.toLowerCase());
      if (tag) {
        message.reply(tag.content);
      } else {
        message.reply(t(locale, "tag.not_found", { name: tagNameToShow }));
      }
      return;
    }

    // If no flags were provided, show the usage help.
    message.reply(t(locale, "tag.usage_help_flags"));
  },
});
