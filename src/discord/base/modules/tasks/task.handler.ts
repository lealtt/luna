import type { Client, ClientEvents } from "discord.js";
import { logger } from "#utils";
import cron, { type ScheduledTask } from "node-cron";
import { taskRegistry } from "#discord/modules";

const intervalIds = new Map<string, NodeJS.Timeout>();
const cronTasks = new Map<string, ScheduledTask>();
const maxCtronTasks = 100;

async function runTaskLogic(client: Client, taskName: string) {
  const task = taskRegistry.store.get(taskName);
  if (!task) {
    logger.warn(`Task "${taskName}" was requested to run but not found in registry.`);
    return;
  }

  try {
    await task.run(client);
  } catch (error) {
    logger.error(`Error executing task "${task.name}":`, error);
  }
}

async function runIntervalTaskWrapper(client: Client, taskName: string) {
  const task = taskRegistry.store.get(taskName);
  if (!task || !task.interval) return;
  await runTaskLogic(client, taskName);
}

async function runCronTaskWrapper(client: Client, taskName: string) {
  const task = taskRegistry.store.get(taskName);
  if (!task || !task.cron) return;
  await runTaskLogic(client, taskName);
}

export function startTaskRunner(client: Client): void {
  if (taskRegistry.store.size > maxCtronTasks) {
    logger.warn(
      `Too many tasks registered (${taskRegistry.store.size}). Consider reducing cron tasks.`,
    );
  }

  for (const task of taskRegistry.store.values()) {
    if (task.cron) {
      if (!cron.validate(task.cron)) {
        logger.error(`Invalid cron pattern "${task.cron}" for task "${task.name}".`);
        continue;
      }
      if (task.cron.includes("* * * * * *")) {
        logger.warn(
          `High-frequency cron pattern detected for task "${task.name}". Consider using interval instead.`,
        );
      }
      const scheduledTask = cron.schedule(task.cron, () => {
        runCronTaskWrapper(client, task.name);
      });
      cronTasks.set(task.name, scheduledTask);
    } else if (task.interval) {
      const intervalId = setInterval(() => {
        runIntervalTaskWrapper(client, task.name);
      }, task.interval);
      intervalIds.set(task.name, intervalId);
    }

    if (task.runImmediately) {
      runTaskLogic(client, task.name).catch((error) =>
        logger.error(`Error on immediate run of task "${task.name}":`, error),
      );
    }
  }
  logger.task(`Scheduled ${taskRegistry.store.size} tasks.`);
}

export function stopTask(taskName: string): void {
  const intervalId = intervalIds.get(taskName);
  if (intervalId) {
    clearInterval(intervalId);
    intervalIds.delete(taskName);
  }

  const cronTask = cronTasks.get(taskName);
  if (cronTask) {
    cronTask.stop();
    cronTasks.delete(taskName);
  }
}

export function cleanupTasks(client: Client): void {
  client.on("destroy" as keyof ClientEvents, () => {
    intervalIds.forEach((id) => clearInterval(id));
    intervalIds.clear();
    cronTasks.forEach((task) => task.stop());
    cronTasks.clear();
    logger.task("Cleaned up all scheduled tasks.");
  });
}
