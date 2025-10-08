import type { Client } from "discord.js";

/**
 * Defines the structure for a scheduled task.
 */
export interface Task {
  name: string;
  interval: number;
  runImmediately?: boolean;
  run: (client: Client) => any | Promise<any>;
}

/** The central registry for all scheduled tasks. */
export const taskRegistry = new Map<string, Task>();

/** Registers a task to the registry. */
export function registerTask(task: Task) {
  taskRegistry.set(task.name, task);
}
