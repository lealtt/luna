import type { Client } from "discord.js";

// Defines the structure for a scheduled task.
export interface Task {
  name: string;
  interval: number;
  runImmediately?: boolean;
  run: (client: Client) => any | Promise<any>;
}

/** Task registry */
export const taskRegistry = new Map<string, Task>();

/** Register a task */
export function registerTask(task: Task) {
  taskRegistry.set(task.name, task);
}
