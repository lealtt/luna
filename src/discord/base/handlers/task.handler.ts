import { type Client } from "discord.js";
import { taskRegistry } from "#discord/modules";
import { logger } from "#utils";
import cron from "node-cron";

/**
 * Schedules and recursively runs a single task based on a fixed interval.
 * @param client The Discord client instance.
 * @param taskName The name of the task to run.
 */
async function runIntervalTask(client: Client, taskName: string) {
  const task = taskRegistry.get(taskName);
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
 * @param client The Discord client instance.
 */
export function startTaskRunner(client: Client): void {
  for (const task of taskRegistry.values()) {
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
    } else if (task.interval) {
      setTimeout(() => runIntervalTask(client, task.name), task.interval);
    }

    if (task.runImmediately) {
      try {
        task.run(client);
      } catch (error) {
        logger.error(`Error on immediate run of task "${task.name}":`, error);
      }
    }
  }
  logger.task(`Scheduled ${taskRegistry.size} tasks.`);
}
