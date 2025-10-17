import type { Client } from "discord.js";
import { hookRegistry } from "./hooks.registry.js";
import type { HookCallback, HookOptions, HookContext } from "./hooks.types.js";

export const BotLifecycle = {
  BeforeInit: "bot:before-init",
  AfterInit: "bot:after-init",
  BeforeDbConnect: "bot:before-db-connect",
  AfterDbConnect: "bot:after-db-connect",
  BeforeModulesLoad: "bot:before-modules-load",
  AfterModulesLoad: "bot:after-modules-load",
  ModuleLoaded: "bot:module-loaded",
  BeforeCommandsRegister: "bot:before-commands-register",
  AfterCommandsRegister: "bot:after-commands-register",
  CommandRegistered: "bot:command-registered",
  BeforeLogin: "bot:before-login",
  AfterLogin: "bot:after-login",
  ClientReady: "bot:client-ready",
  BeforeTasksStart: "bot:before-tasks-start",
  AfterTasksStart: "bot:after-tasks-start",
  BeforeShutdown: "bot:before-shutdown",
  AfterShutdown: "bot:after-shutdown",
  CriticalError: "bot:critical-error",
  ModuleError: "bot:module-error",
} as const;

export type BotLifecycleEvent = (typeof BotLifecycle)[keyof typeof BotLifecycle];

export function onBotEvent(
  event: BotLifecycleEvent | string | (BotLifecycleEvent | string)[],
  callback: HookCallback<any>,
  options?: HookOptions,
): string | string[] {
  if (Array.isArray(event)) {
    return event.map((e) => hookRegistry.register(String(e), callback, options));
  }
  return hookRegistry.register(String(event), callback, options);
}

export function onAnyBotEvent(callback: HookCallback<any>, options?: HookOptions): string {
  return hookRegistry.registerGlobal(callback, options);
}

export function offBotEvent(hookId: string): boolean {
  return hookRegistry.unregister(hookId);
}

export async function emitBotEvent<TData = Record<string, any>>(
  event: BotLifecycleEvent | string,
  client: Client,
  data: TData,
  phase?: string,
): Promise<void> {
  const context: HookContext<TData> = {
    client,
    timestamp: Date.now(),
    phase: phase || String(event),
    data,
  };

  await hookRegistry.execute(String(event), context);
}

export { hookRegistry };
