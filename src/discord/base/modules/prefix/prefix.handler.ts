import { inlineCode, Message } from "discord.js";
import { env, logger, t } from "#utils";
import { ZodError, type ZodObject } from "zod";
import { parseFlags, prefixCommandRegistry } from "./prefix.module.js";
import { runMiddlewareChain } from "../shared/middleware.module.js";
import { rateLimitMiddleware } from "#discord/security";

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
    await message.reply({
      content: t(message.locale, "common_errors.guild_only"),
    });
    return;
  }

  try {
    const allMiddlewares = [rateLimitMiddleware, ...(command.middlewares ?? [])];

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

    await runMiddlewareChain(message, allMiddlewares, finalHandler);
  } catch (error) {
    if (error instanceof ZodError && command?.flags?.schema) {
      const fullErrorMessage = formatZodError(error, command.flags.schema as ZodObject<any>);
      await message.reply({
        content: t(message.locale, "common_errors.invalid_args", { errors: fullErrorMessage }),
      });
    } else {
      logger.error(`Error executing prefix command "${command.name}":`, error);
      await message.reply({
        content: t(message.locale, "common_errors.generic"),
      });
    }
  }
}
