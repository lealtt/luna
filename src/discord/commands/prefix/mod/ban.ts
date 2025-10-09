import { createPrefixCommand } from "#discord/creators";
import { logPrefixCommand, checkPermissions } from "#discord/middlewares";
import { t } from "#utils";
import { z } from "zod";

const BanFlagsSchema = z.object({
  days: z.coerce.number().int().min(0).max(7).default(1),
  member: z.string({ error: "You must specify a member to ban." }),
  reason: z.string().optional(),
});

createPrefixCommand({
  name: "ban",
  flags: BanFlagsSchema,
  middlewares: [logPrefixCommand, checkPermissions("BanMembers")],
  async run(message, flags) {
    const { days, member: memberQuery, reason } = flags;
    const { locale } = message;

    const memberMention = memberQuery;

    const plural = t(locale, days === 1 ? "ban.plural_day" : "ban.plural_days");
    const reasonText = reason
      ? t(locale, "ban.reason_provided", { reason })
      : t(locale, "ban.no_reason");

    await message.reply(
      t(locale, "ban.reply", {
        member: memberMention,
        reason: reasonText,
        days: days,
        plural: plural,
      }),
    );
  },
});
