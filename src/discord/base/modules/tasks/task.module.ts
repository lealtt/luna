import { Registry } from "#discord/structures";
import {
  NameValidator,
  RunFunctionValidator,
  TaskScheduleValidator,
} from "../shared/validators.js";
import type { Task } from "./task.types.js";

class TaskRegistry extends Registry<Task> {
  private static instance: TaskRegistry;
  protected readonly registryName = "Task";

  protected constructor() {
    super();
  }

  public static getInstance(): TaskRegistry {
    if (!TaskRegistry.instance) {
      TaskRegistry.instance = new TaskRegistry();
    }
    return TaskRegistry.instance;
  }

  protected validate(item: Task): void {
    const nameValidator = new NameValidator<Task>();
    const runFunctionValidator = new RunFunctionValidator<Task>();
    const scheduleValidator = new TaskScheduleValidator<Task>();

    nameValidator.setNext(runFunctionValidator).setNext(scheduleValidator);

    nameValidator.validate(item);

    super.validate(item);
  }
}

export const taskRegistry = TaskRegistry.getInstance();

export function createTask(options: Task) {
  taskRegistry.register(options);
}
