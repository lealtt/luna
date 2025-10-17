import { onBotEvent } from "#discord/hooks";
import type { AnyInteraction, AnyComponent } from "#discord/modules";
import { logger } from "#utils";
import { executionTimers } from "./timer.js";

onBotEvent(
  "component:beforeExecute",
  ({ data }) => {
    const interaction = data.interaction as AnyInteraction;
    const handler = data.handler as AnyComponent;
    const executionId = `comp-${interaction.id}`;
    executionTimers.set(executionId, Date.now());
    logger.debug(`[COMP][${handler.customId}] Executing... (User: ${interaction.user.id})`);
  },
  { name: "monitor-comp-start", silent: true },
);

onBotEvent(
  "component:afterExecute",
  ({ data }) => {
    const interaction = data.interaction as AnyInteraction;
    const handler = data.handler as AnyComponent;
    const executionId = `comp-${interaction.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.info(
      `[COMP][${handler.customId}] Success (${duration}ms) (User: ${interaction.user.id})`,
    );
    executionTimers.delete(executionId);
  },
  { name: "monitor-comp-success", silent: true },
);

onBotEvent(
  "component:error",
  ({ data }) => {
    const interaction = data.interaction as AnyInteraction;
    const handler = data.handler as AnyComponent;
    const error = data.error as Error;
    const executionId = `comp-${interaction.id}`;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.error(
      `[COMP][${handler.customId}] Failed (${duration}ms) (User: ${interaction.user.id}) Error: ${error.message}`,
    );
    executionTimers.delete(executionId);
  },
  { name: "monitor-comp-error", silent: true },
);
