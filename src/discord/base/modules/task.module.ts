import type { Client } from "discord.js";
import { logger } from "#utils";

// Types and Interfaces
type TaskSchedule = { interval: number; cron?: never } | { cron: string; interval?: never };

export type Task = {
  name: string;
  runImmediately?: boolean;
  run: (client: Client) => any | Promise<any>;
} & TaskSchedule;

export const taskRegistry = new Map<string, Task>();

/**
 * Registers a new task to the registry and logs it.
 * @param task The task object to register.
 */
function registerTask(task: Task) {
  taskRegistry.set(task.name, task);
  logger.module(`Registered task: ${task.name}`);
}

/**
 * Defines and registers a new scheduled task.
 * @param options The task configuration.
 */
export function createTask(options: Task) {
  registerTask(options);
}
