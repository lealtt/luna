import { logger } from "#utils";
import type {
  HookCallback,
  HookContext,
  HookOptions,
  HookPriority,
  RegisteredHook,
} from "./hooks.types.js";

class HookRegistry {
  private hooks = new Map<string, Set<RegisteredHook<any>>>();
  private globalHooks = new Set<RegisteredHook<any>>();
  private executionStats = new Map<string, number[]>();

  register(event: string, callback: HookCallback<any>, options: HookOptions = {}): string {
    const hook: RegisteredHook<any> = {
      id: this.generateId(),
      name: options.name || `anonymous_hook_${Date.now()}`,
      callback,
      priority: options.priority || "normal",
      once: options.once || false,
      timeout: options.timeout || 30000,
      silent: options.silent || false,
      executionCount: 0,
      averageExecutionTime: 0,
    };

    if (!this.hooks.has(event)) {
      this.hooks.set(event, new Set());
    }
    this.hooks.get(event)!.add(hook);
    this.sortHooks(event);

    if (!hook.silent) {
      logger.debug(`Hook registered: ${hook.name} for event ${event}`);
    }
    return hook.id;
  }

  registerGlobal(callback: HookCallback<any>, options: HookOptions = {}): string {
    const hook: RegisteredHook<any> = {
      id: this.generateId(),
      name: options.name || `global_hook_${Date.now()}`,
      callback,
      priority: options.priority || "normal",
      once: options.once || false,
      timeout: options.timeout || 30000,
      silent: options.silent || false,
      executionCount: 0,
      averageExecutionTime: 0,
    };
    this.globalHooks.add(hook);
    if (!hook.silent) {
      logger.debug(`Global hook registered: ${hook.name}`);
    }
    return hook.id;
  }

  unregister(hookId: string): boolean {
    for (const [event, hooks] of this.hooks.entries()) {
      for (const hook of hooks) {
        if (hook.id === hookId) {
          hooks.delete(hook);
          if (hooks.size === 0) {
            this.hooks.delete(event);
          }
          return true;
        }
      }
    }

    for (const hook of this.globalHooks) {
      if (hook.id === hookId) {
        this.globalHooks.delete(hook);
        return true;
      }
    }

    return false;
  }

  clearEvent(event: string): void {
    this.hooks.delete(event);
  }

  clearAll(): void {
    this.hooks.clear();
    this.globalHooks.clear();
    this.executionStats.clear();
  }

  async execute(event: string, context: HookContext<any>): Promise<void> {
    const eventHooks = this.hooks.get(event);
    const allHooks = [
      ...(eventHooks ? Array.from(eventHooks) : []),
      ...Array.from(this.globalHooks),
    ].sort((a, b) => this.comparePriority(a.priority, b.priority));

    const results = await Promise.allSettled(
      allHooks.map((hook) => this.executeHook(hook, context, event)),
    );

    const errors = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (errors.length > 0) {
      logger.error(
        `${errors.length} hook(s) failed during "${event}" event:`,
        errors.map((e) => (e.reason instanceof Error ? e.reason.message : String(e.reason))),
      );
    }

    const hooksToRemove = allHooks.filter((hook) => hook.once && hook.executionCount > 0);
    for (const hook of hooksToRemove) {
      this.unregister(hook.id);
    }
  }

  private async executeHook(
    hook: RegisteredHook<any>,
    context: HookContext<any>,
    event: string,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Hook timeout after ${hook.timeout}ms: ${hook.name}`)),
          hook.timeout,
        ),
      );

      await Promise.race([hook.callback(context), timeoutPromise]);

      const executionTime = Date.now() - startTime;
      hook.executionCount++;
      hook.lastExecutedAt = Date.now();
      hook.averageExecutionTime =
        (hook.averageExecutionTime * (hook.executionCount - 1) + executionTime) /
        hook.executionCount;

      if (!this.executionStats.has(event)) {
        this.executionStats.set(event, []);
      }
      const times = this.executionStats.get(event)!;
      if (times.length > 100) times.shift();
      times.push(executionTime);

      if (!hook.silent && executionTime > 1000) {
        logger.warn(`Hook "${hook.name}" took ${executionTime}ms to execute`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Hook "${hook.name}" failed: ${errorMessage}`);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private sortHooks(event: string): void {
    const hooks = this.hooks.get(event);
    if (!hooks) return;
    const sorted = Array.from(hooks).sort((a, b) => this.comparePriority(a.priority, b.priority));
    this.hooks.set(event, new Set(sorted));
  }

  private comparePriority(a: HookPriority, b: HookPriority): number {
    const order = { critical: 0, high: 1, normal: 2, low: 3 };
    return order[a] - order[b];
  }

  private generateId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  getStats(event?: string) {
    if (event) {
      const times = this.executionStats.get(event) || [];
      return {
        event,
        executions: times.length,
        averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
        maxTime: times.length > 0 ? Math.max(...times) : 0,
        minTime: times.length > 0 ? Math.min(...times) : 0,
      };
    }
    const allStats = Array.from(this.executionStats.entries()).map(([evt, times]) => ({
      event: evt,
      executions: times.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
    }));
    return allStats;
  }

  list(event?: string) {
    if (event) {
      const hooks = this.hooks.get(event);
      return hooks ? Array.from(hooks) : [];
    }
    const all: { event: string; hook: RegisteredHook }[] = [];
    for (const [evt, hooks] of this.hooks.entries()) {
      for (const hook of hooks) {
        all.push({ event: evt, hook });
      }
    }
    for (const hook of this.globalHooks) {
      all.push({ event: "*", hook });
    }
    return all;
  }
}

export const hookRegistry = new HookRegistry();
