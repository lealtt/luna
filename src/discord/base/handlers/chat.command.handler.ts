import { Collection, inlineCode, Message, time } from "discord.js";
import { parseFlags, prefixCommandRegistry, type PrefixCommand } from "#discord/registry";
import { env, logger, t } from "#utils";
import { ZodError, type ZodObject } from "zod";
import { runMiddlewareChain } from "#discord/base/middleware";

/**
 * Checks and handles the cooldown for a prefix command.
 * @param message The message that triggered the command.
 * @param command The command to check the cooldown for.
 * @returns True if the user is on cooldown, false otherwise.
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
 * Handles the logic for parsing and executing a prefix command from a message.
 * @param message The message object from the MessageCreate event.
 */
export async function handlePrefixCommand(message: Message) {
  if (message.author.bot) return;

  const usedPrefix = env.BOT_PREFIX.find((prefix) => message.content.startsWith(prefix));
  if (!usedPrefix) return;

  const content = message.content.slice(usedPrefix.length).trim();
  const commandName = content.split(/ +/)[0]?.toLowerCase();

  if (!commandName) return;

  const command = prefixCommandRegistry.get(commandName);
  if (!command) return;

  if (command.guilds && command.guilds.length > 0) {
    if (!message.inGuild() || !command.guilds.includes(message.guild.id)) return;
  }

  if (await handleCooldown(message, command)) return;

  try {
    const finalHandler = async () => {
      if (command.flags) {
        const rawArgs = content.slice(commandName.length).trim();
        const { schema, config } = command.flags;
        const rawFlags = parseFlags(rawArgs, config);
        const parsedFlags = schema.parse(rawFlags);
        await command.run(message, parsedFlags);
      } else {
        const args = content.split(/ +/).slice(1);
        await command.run(message, args);
      }
    };

    const middlewares = command.middlewares ?? [];
    await runMiddlewareChain(message, middlewares, finalHandler);
  } catch (error) {
    if (error instanceof ZodError && command?.flags?.schema) {
      const schema = command.flags.schema as ZodObject<any>;
      const errorMessages = error.issues.map((e) => `> • **${e.path.join(".")}**: ${e.message}`);
      const optionalFlags = Object.keys(schema.shape)
        .filter((key) => schema.shape[key].isOptional())
        .map((key) => `> • ${inlineCode(key)}`);

      let fullErrorMessage = errorMessages.join("\n");
      if (optionalFlags.length > 0) {
        const optionalFlagsText = t(message.locale, "common_errors.optional_flags_title");
        fullErrorMessage += `\n\n**${optionalFlagsText}**\n${optionalFlags.join("\n")}`;
      }

      await message.reply(
        t(message.locale, "common_errors.invalid_args", { errors: fullErrorMessage }),
      );
    } else {
      logger.error(`Error executing prefix command "${command.name}":`, error);
      await message.reply(t(message.locale, "common_errors.generic"));
    }
  }
}
