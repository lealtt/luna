import { onBotEvent } from "#discord/hooks";
import type { Task } from "#discord/modules";
import { logger } from "#utils";
import { executionTimers } from "./timer.js";

onBotEvent(
  "task:beforeRun",
  ({ data }) => {
    const task = data.task as Task;
    const executionId = `task-${task.name}-${Date.now()}`;
    executionTimers.set(executionId, Date.now());
    logger.debug(`[TASK][${task.name}] Running...`);
    data.executionId = executionId;
  },
  { name: "monitor-task-start", silent: true },
);

onBotEvent(
  "task:afterRun",
  ({ data }) => {
    const task = data.task as Task;
    const executionId = data.executionId as string;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.info(`[TASK][${task.name}] Success (${duration}ms)`);
    executionTimers.delete(executionId);
  },
  { name: "monitor-task-success", silent: true },
);

onBotEvent(
  "task:error",
  ({ data }) => {
    const task = data.task as Task;
    const error = data.error as Error;
    const executionId = data.executionId as string;
    const startTime = executionTimers.get(executionId);
    const duration = startTime ? Date.now() - startTime : 0;
    logger.error(`[TASK][${task.name}] Failed (${duration}ms) Error: ${error.message}`);
    executionTimers.delete(executionId);
  },
  { name: "monitor-task-error", silent: true },
);
