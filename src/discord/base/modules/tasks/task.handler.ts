import { type Client } from "discord.js";
import { logger } from "#utils";
import cron from "node-cron";
import { taskRegistry } from "#discord/modules";

async function runIntervalTask(client: Client, taskName: string) {
  const task = taskRegistry.store.get(taskName);
  if (!task || !task.interval) return;

  try {
    await task.run(client);
  } catch (error) {
    logger.error(`Error executing task "${task.name}":`, error);
  } finally {
    setTimeout(() => runIntervalTask(client, taskName), task.interval);
  }
}

export function startTaskRunner(client: Client): void {
  for (const task of taskRegistry.store.values()) {
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
  logger.task(`Scheduled ${taskRegistry.store.size} tasks.`);
}
