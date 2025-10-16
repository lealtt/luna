import { StateManager } from "#discord/structures";
import { Timer } from "#utils";
import type { PaginatorState } from "#discord/modules";

export type PaginatorStateData<T = any> = PaginatorState<T>;

export const paginatorState = new StateManager<PaginatorStateData>({
  name: "Paginator",
  maxSize: 1000,
  defaultTTL: Timer(10).min(),
  cleanupInterval: Timer(1).min(),
  warningThreshold: 0.9,
});
