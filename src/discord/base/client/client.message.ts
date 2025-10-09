import { createEvent } from "#discord/creators";
import { parseFlags, prefixCommandRegistry, type PrefixCommand } from "#discord/registry";
import { env, logger, t } from "#utils";
import { Collection, Events, inlineCode, Message, time } from "discord.js";
import { ZodError } from "zod";
import { runMiddlewareChain } from "#discord/base/middleware";

/**
 * Checks and handles the cooldown for a prefix command.
 */
async function handleCooldown(message: Message, command: PrefixCommand): Promise<boolean> {
  if (!command.cooldown) return false;

  const { cooldowns } = message.client;
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name)!;
  const cooldownAmount = command.cooldown * 1000;
  const userTimestamp = timestamps.get(message.author.id);

  if (userTimestamp) {
    const expirationTime = userTimestamp + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = time(Math.floor(expirationTime / 1000), "R");
      await message.reply({
        content: t(message.locale, "common_errors.cooldown", {
          command: inlineCode(command.name),
          time: timeLeft,
        }),
      });
      return true;
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  return false;
}

/**
 * Handles the MessageCreate event to process prefix commands.
 */
createEvent({
  name: Events.MessageCreate,
  async run(message) {
    if (message.author.bot) return;

    const usedPrefix = env.BOT_PREFIX.find((prefix) => message.content.startsWith(prefix));
    if (!usedPrefix) return;

    const content = message.content.slice(usedPrefix.length).trim();
    const commandName = content.split(/ +/)[0]?.toLowerCase();

    if (!commandName) return;

    const command = prefixCommandRegistry.get(commandName);
    if (!command) return;

    if (await handleCooldown(message, command)) return;

    try {
      const finalHandler = async () => {
        if (command.flags) {
          const rawArgs = content.slice(commandName.length).trim();
          const rawFlags = parseFlags(rawArgs);
          const parsedFlags = command.flags.parse(rawFlags);
          await command.run(message, parsedFlags);
        } else {
          const args = content.split(/ +/).slice(1);
          await command.run(message, args);
        }
      };

      const middlewares = command.middlewares ?? [];
      await runMiddlewareChain(message, middlewares, finalHandler);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((e) => `> • **${e.path.join(".")}**: ${e.message}`);
        await message.reply(
          t(message.locale, "common_errors.invalid_args", {
            errors: errorMessages.join("\n"),
          }),
        );
      } else {
        logger.error(`Error executing prefix command "${command.name}":`, error);
        await message.reply(t(message.locale, "common_errors.generic"));
      }
    }
  },
});
