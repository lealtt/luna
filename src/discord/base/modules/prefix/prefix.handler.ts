import { Collection, inlineCode, Message, time } from "discord.js";
import { env, logger, t, type I18nKey } from "#utils";
import { ZodError, type ZodObject } from "zod";
import { parseFlags, prefixCommandRegistry } from "./prefix.module.js";
import { runMiddlewareChain } from "../shared/middleware.module.js";
import type { PrefixCommand } from "./prefix.types.js";

async function checkCooldown(message: Message, command: PrefixCommand): Promise<boolean> {
  if (!command.cooldown) return false;

  const client = message.client;
  const cooldowns = client.cooldowns;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const timestamps = cooldowns.get(command.name)!;
  const now = Date.now();
  const cooldownAmount = command.cooldown * 1000;
  const userTimestamp = timestamps.get(message.author.id);

  if (userTimestamp && now < userTimestamp + cooldownAmount) {
    const expirationTime = Math.floor((userTimestamp + cooldownAmount) / 1000);
    await message.reply({
      content: t(message.locale, "common_errors.cooldown", {
        command: inlineCode(command.name),
        time: time(expirationTime, "R"),
      }),
    });
    return true;
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  return false;
}

async function sendErrorReply(
  message: Message,
  messageKey: I18nKey = "common_errors.generic",
  variables?: Record<string, string | number>,
): Promise<void> {
  await message.reply({
    content: t(message.locale, messageKey, variables),
  });
}

function formatZodError(error: ZodError, schema: ZodObject<any>): string {
  const errorMessages = error.issues.map((e) => `> • **${e.path.join(".")}**: ${e.message}`);
  const optionalFlags = Object.keys(schema.shape)
    .filter((key) => schema.shape[key].isOptional())
    .map((key) => `> • ${inlineCode(key)}`);

  let fullErrorMessage = errorMessages.join("\n");
  if (optionalFlags.length > 0) {
    const optionalFlagsText = t("en-US", "common_errors.optional_flags_title");
    fullErrorMessage += `\n\n**${optionalFlagsText}**\n${optionalFlags.join("\n")}`;
  }
  return fullErrorMessage;
}

export async function handlePrefixCommand(message: Message): Promise<void> {
  if (message.author.bot) return;

  const usedPrefix = env.BOT_PREFIX.find((prefix) => message.content.startsWith(prefix));
  if (!usedPrefix) return;

  const content = message.content.slice(usedPrefix.length).trim();
  const commandName = content.split(/ +/)[0]?.toLowerCase();
  if (!commandName) return;

  const command = prefixCommandRegistry.store.get(commandName);
  if (!command) return;

  if (
    command.guilds?.length &&
    (!message.inGuild() || !command.guilds.includes(message.guild.id))
  ) {
    await sendErrorReply(message, "common_errors.guild_only");
    return;
  }

  if (await checkCooldown(message, command)) return;

  try {
    const finalHandler = async () => {
      if (command.flags) {
        const rawArgs = content.slice(commandName.length).trim();
        const parsedFlags = parseFlags(rawArgs, command.flags);
        await command.run(message, parsedFlags);
      } else {
        const args = content.split(/ +/).slice(1);
        await command.run(message, args);
      }
    };

    await runMiddlewareChain(message, command.middlewares ?? [], finalHandler);
  } catch (error) {
    if (error instanceof ZodError && command?.flags?.schema) {
      const fullErrorMessage = formatZodError(error, command.flags.schema as ZodObject<any>);
      await sendErrorReply(message, "common_errors.invalid_args", { errors: fullErrorMessage });
    } else {
      logger.error(`Error executing prefix command "${command.name}":`, error);
      await sendErrorReply(message);
    }
  }
}
