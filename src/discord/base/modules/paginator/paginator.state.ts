import { StateManager } from "#discord/structures";
import { Timer } from "#utils";
import type { PaginatorState } from "#discord/modules";
import { BotLifecycle, onBotEvent } from "#discord/hooks";

export type PaginatorStateData<T = any> = PaginatorState<T>;

export const paginatorState = new StateManager<PaginatorStateData>({
  name: "Paginator",
  maxSize: 1000,
  defaultTTL: Timer(10).min(),
  cleanupInterval: Timer(1).min(),
  warningThreshold: 0.9,
});

onBotEvent(
  BotLifecycle.BeforeShutdown,
  () => {
    paginatorState.destroy();
  },
  { name: "paginator-state-shutdown", silent: true },
);
