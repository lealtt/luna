import { type Task, registerTask } from "#discord/registry";

/**
 * Defines and registers a new scheduled task.
 * @param options The task configuration.
 */
export function createTask(options: Task) {
  registerTask(options);
}
