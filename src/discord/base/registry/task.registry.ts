import type { Client } from "discord.js";

/**
 * Defines the scheduling options for a task.
 * A task must have either an 'interval' (in milliseconds) or a 'cron' pattern, but not both.
 */
type TaskSchedule = { interval: number; cron?: never } | { cron: string; interval?: never };

/**
 * Defines the structure for a scheduled task, combining the core properties
 * with the required scheduling options.
 */
export type Task = {
  name: string;
  runImmediately?: boolean;
  run: (client: Client) => any | Promise<any>;
} & TaskSchedule;

/**
 * The central registry that holds all defined tasks.
 * The key is the task's unique name.
 */
export const taskRegistry = new Map<string, Task>();

/**
 * Registers a new task to the registry.
 * @param task The task object to register.
 */
export function registerTask(task: Task) {
  taskRegistry.set(task.name, task);
}
