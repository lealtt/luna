import { onBotEvent } from "#discord/hooks";
import type { AnyApplicationCommandInteraction, StorableCommand } from "#discord/modules";
import { logger } from "#utils";
import { executionTimers } from "./timer.js";

onBotEvent(
  "command:beforeExecute",
  ({ data }) => {
    const interaction = data.interaction as AnyApplicationCommandInteraction;
    const command = data.command as StorableCommand;
    const executionId = `cmd-${interaction.id}`;
    executionTimers.set(executionId, Date.now());
    logger.debug(`[CMD][${command.name}] Executing... (User: ${interaction.user.id})`);
  },
  { name: "monitor-cmd-start", silent: true },
);

onBotEvent(
  "command:afterExecute",
  ({ data }) => {
    const interaction = data.interaction as AnyApplicationCommandInteraction;
    const command = data.command as StorableCommand;
    const executionId = `cmd-${interaction.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.info(`[CMD][${command.name}] Success (${duration}ms) (User: ${interaction.user.id})`);
    executionTimers.delete(executionId);
  },
  { name: "monitor-cmd-success", silent: true },
);

onBotEvent(
  "command:error",
  ({ data }) => {
    const interaction = data.interaction as AnyApplicationCommandInteraction;
    const command = data.command as StorableCommand;
    const error = data.error as Error;
    const executionId = `cmd-${interaction.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.error(
      `[CMD][${command.name}] Failed (${duration}ms) (User: ${interaction.user.id}) Error: ${error.message}`,
    );
    executionTimers.delete(executionId);
  },
  { name: "monitor-cmd-error", silent: true },
);
