import { onBotEvent } from "#discord/hooks";
import type { PrefixCommand } from "#discord/modules";
import { logger } from "#utils";
import type { Message } from "discord.js";
import { executionTimers } from "./timer.js";

onBotEvent(
  "prefixCommand:beforeExecute",
  ({ data }) => {
    const message = data.message as Message;
    const command = data.command as PrefixCommand;
    const executionId = `prefix-${message.id}`;
    executionTimers.set(executionId, Date.now());
    logger.debug(`[PREFIX][${command.name}] Executing... (User: ${message.author.id})`);
  },
  { name: "monitor-prefix-start", silent: true },
);

onBotEvent(
  "prefixCommand:afterExecute",
  ({ data }) => {
    const message = data.message as Message;
    const command = data.command as PrefixCommand;
    const executionId = `prefix-${message.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.info(`[PREFIX][${command.name}] Success (${duration}ms) (User: ${message.author.id})`);
    executionTimers.delete(executionId);
  },
  { name: "monitor-prefix-success", silent: true },
);

onBotEvent(
  "prefixCommand:error",
  ({ data }) => {
    const message = data.message as Message;
    const command = data.command as PrefixCommand;
    const error = data.error as Error;
    const executionId = `prefix-${message.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.error(
      `[PREFIX][${command.name}] Failed (${duration}ms) (User: ${message.author.id}) Error: ${error.message}`,
    );
    executionTimers.delete(executionId);
  },
  { name: "monitor-prefix-error", silent: true },
);
