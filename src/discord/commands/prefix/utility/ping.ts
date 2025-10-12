import { createPrefixCommand } from "#discord/modules";
import { auditPrefixCommand } from "#discord/middlewares";
import { t } from "#utils";

createPrefixCommand({
  name: "ping",
  aliases: ["p"],
  cooldown: 5,
  middlewares: [auditPrefixCommand],
  run(message) {
    const { locale } = message;
    const latency = Date.now() - message.createdTimestamp;

    message.reply(t(locale, "ping.reply", { latency }));
  },
});
