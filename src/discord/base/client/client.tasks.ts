import type { Client } from "discord.js";
import { taskRegistry } from "#discord/registry";
import { logger } from "#utils";
import cron from "node-cron";

/**
 * Schedules and recursively runs a single task based on a fixed interval.
 * After each execution, it schedules the next one using setTimeout.
 * @param client The Discord client instance.
 * @param taskName The name of the task to run.
 */
async function runIntervalTask(client: Client, taskName: string) {
  const task = taskRegistry.get(taskName);
  // Ensure the task exists and is an interval-based task.
  if (!task || !task.interval) return;

  try {
    await task.run(client);
  } catch (error) {
    logger.error(`Error executing task "${task.name}":`, error);
  } finally {
    // Reschedule the next run after the current one finishes.
    setTimeout(() => runIntervalTask(client, taskName), task.interval);
  }
}

/**
 * Initializes the task runner, scheduling all registered tasks.
 * It intelligently handles both cron-based and interval-based tasks.
 * @param client The Discord client instance.
 * @returns The number of tasks that were scheduled.
 */
export function startTaskRunner(client: Client): number {
  for (const task of taskRegistry.values()) {
    // Handle cron-based tasks.
    if (task.cron) {
      if (!cron.validate(task.cron)) {
        logger.error(`Invalid cron pattern "${task.cron}" for task "${task.name}".`);
        continue;
      }

      cron.schedule(task.cron, async () => {
        try {
          await task.run(client);
        } catch (error) {
          logger.error(`Error executing task "${task.name}":`, error);
        }
      });

      // Handle interval-based tasks.
    } else if (task.interval) {
      setTimeout(() => runIntervalTask(client, task.name), task.interval);
    }

    // If 'runImmediately' is true, execute the task once at startup.
    if (task.runImmediately) {
      try {
        task.run(client);
      } catch (error) {
        logger.error(`Error on immediate run of task "${task.name}":`, error);
      }
    }
  }
  return taskRegistry.size;
}
