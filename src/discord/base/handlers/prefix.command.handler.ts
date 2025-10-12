import { Collection, inlineCode, Message, time } from "discord.js";
import {
  parseFlags,
  prefixCommandRegistry,
  type PrefixCommand,
  runMiddlewareChain,
} from "#discord/modules";
import { env, logger, t, type I18nKey } from "#utils";
import { ZodError, type ZodObject } from "zod";

interface ExtendedClient {
  cooldowns: Collection<string, Collection<string, number>>;
}

/**
 * Checks if a user is on cooldown for a prefix command and replies if they are.
 * @param message - The message that triggered the command.
 * @param command - The command to check.
 * @returns True if the user is on cooldown, false otherwise.
 */
async function checkCooldown(message: Message, command: PrefixCommand): Promise<boolean> {
  if (!command.cooldown) return false;

  const client = message.client as ExtendedClient;
  const cooldowns = client.cooldowns;

  // Initialize cooldown collection for the command
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

  // Set new timestamp and schedule cleanup
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  return false;
}

/**
 * Sends an error reply to the user.
 * @param message - The message that triggered the command.
 * @param messageKey - The i18n key for the error message.
 * @param variables - Optional variables for the error message.
 */
async function sendErrorReply(
  message: Message,
  messageKey: I18nKey = "common_errors.generic",
  variables?: Record<string, string | number>,
): Promise<void> {
  await message.reply({
    content: t(message.locale, messageKey, variables),
  });
}

/**
 * Formats Zod validation errors into a user-friendly message.
 * @param error - The Zod validation error.
 * @param schema - The Zod schema used for validation.
 * @returns Formatted error message with optional flags.
 */
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

/**
 * Handles the logic for parsing and executing a prefix command from a message.
 * @param message - The message object from the MessageCreate event.
 */
export async function handlePrefixCommand(message: Message): Promise<void> {
  if (message.author.bot) return;

  // Check for valid prefix
  const usedPrefix = env.BOT_PREFIX.find((prefix) => message.content.startsWith(prefix));
  if (!usedPrefix) return;

  // Extract command name
  const content = message.content.slice(usedPrefix.length).trim();
  const commandName = content.split(/ +/)[0]?.toLowerCase();
  if (!commandName) return;

  // Retrieve command
  const command = prefixCommandRegistry.get(commandName);
  if (!command) return;

  // Check guild restrictions
  if (
    command.guilds?.length &&
    (!message.inGuild() || !command.guilds.includes(message.guild.id))
  ) {
    await sendErrorReply(message, "common_errors.guild_only");
    return;
  }

  // Check cooldown
  if (await checkCooldown(message, command)) return;

  try {
    // Define final handler based on command flags
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

    // Run middleware chain and execute command
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
