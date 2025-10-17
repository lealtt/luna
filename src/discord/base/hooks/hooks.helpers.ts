import { BotLifecycle, onBotEvent, type BotLifecycleEvent } from "./hooks.modules.js";
import type { HookCallback, HookOptions } from "./hooks.types.js";

export function onReady(callback: HookCallback, options?: HookOptions): string {
  return onBotEvent(BotLifecycle.ClientReady, callback, options) as string;
}

export function beforeInit(callback: HookCallback, options?: HookOptions): string {
  return onBotEvent(BotLifecycle.BeforeInit, callback, options) as string;
}

export function afterInit(callback: HookCallback, options?: HookOptions): string {
  return onBotEvent(BotLifecycle.AfterInit, callback, options) as string;
}

export function beforeShutdown(callback: HookCallback, options?: HookOptions): string {
  return onBotEvent(BotLifecycle.BeforeShutdown, callback, options) as string;
}

export function afterDbConnect(callback: HookCallback, options?: HookOptions): string {
  return onBotEvent(BotLifecycle.AfterDbConnect, callback, options) as string;
}

export function registerHooks(hooks: Record<BotLifecycleEvent, HookCallback>): string[] {
  return Object.entries(hooks).map(
    ([event, callback]) => onBotEvent(event as BotLifecycleEvent, callback) as string,
  );
}
