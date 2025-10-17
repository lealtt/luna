import type { Client } from "discord.js";

export type HookContext<TData = Record<string, any>> = {
  client: Client;
  timestamp: number;
  phase: string;
  data: TData;
};

export type HookCallback<TData = any> = (context: HookContext<TData>) => Promise<void> | void;

export type HookPriority = "critical" | "high" | "normal" | "low";

export interface HookOptions {
  name?: string;
  priority?: HookPriority;
  once?: boolean;
  timeout?: number;
  silent?: boolean;
}

export interface RegisteredHook<TData = any> {
  id: string;
  name: string;
  callback: HookCallback<TData>;
  priority: HookPriority;
  once: boolean;
  timeout: number;
  silent: boolean;
  executionCount: number;
  lastExecutedAt?: number;
  averageExecutionTime: number;
}
