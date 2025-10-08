import type { Client } from "discord.js";
import { taskRegistry } from "#discord/registry";
import { logger } from "#utils";

/**
 * Schedules and runs a single task, ensuring it reschedules itself after completion.
 */
async function runTask(client: Client, taskName: string) {
  const task = taskRegistry.get(taskName);
  if (!task) return;

  try {
    await task.run(client);
  } catch (error) {
    logger.error(`Error executing task "${task.name}":`, error);
  } finally {
    setTimeout(() => runTask(client, taskName), task.interval);
  }
}

/**
 * Starts the task scheduler.
 * @param client The Discord client instance.
 * @returns The number of tasks that were scheduled.
 */
export function startTaskRunner(client: Client): number {
  for (const task of taskRegistry.values()) {
    if (task.runImmediately) {
      try {
        task.run(client);
      } catch (error) {
        logger.error(`Error on immediate run of task "${task.name}":`, error);
      }
    }
    setTimeout(() => runTask(client, task.name), task.interval);
  }
  return taskRegistry.size;
}
