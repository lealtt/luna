import { Registry } from "../../structures/Registry.js";
import {
  NameValidator,
  RunFunctionValidator,
  TaskScheduleValidator,
} from "../shared/validators.js";
import type { Task } from "./task.types.js";

class TaskRegistry extends Registry<Task> {
  private static instance: TaskRegistry;
  protected readonly registryName = "Task";
  private validationCache = new Map<string, boolean>();

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
    const cacheKey = `${item.name}:${item.interval ?? ""}:${item.cron ?? ""}:${item.run.toString()}`;
    if (this.validationCache.has(cacheKey)) {
      return;
    }

    const nameValidator = new NameValidator<Task>();
    const runFunctionValidator = new RunFunctionValidator<Task>();
    const scheduleValidator = new TaskScheduleValidator<Task>();

    nameValidator.setNext(runFunctionValidator).setNext(scheduleValidator);

    nameValidator.validate(item);

    this.validationCache.set(cacheKey, true);
    super.validate(item);
  }
}

export const taskRegistry = TaskRegistry.getInstance();

export function createTask(options: Task) {
  taskRegistry.register(options);
}
