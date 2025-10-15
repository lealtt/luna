import { createPrefixCommand } from "#discord/modules";
import { t } from "#utils";

createPrefixCommand({
  name: "ping",
  aliases: ["p"],
  run(message) {
    const { locale } = message;

    const latency = Date.now() - message.createdTimestamp;

    message.reply(t(locale, "ping.reply", { latency }));
  },
});
