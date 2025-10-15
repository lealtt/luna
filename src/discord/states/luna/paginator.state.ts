import { StateManager } from "#discord/structures";
import { Timer } from "#utils";

type PaginatorStateData = {
  items: any[];
  itemsPerPage: number;
  currentPage: number;
  userId: string;
  paginatorId: string;
};

export const paginatorState = new StateManager<PaginatorStateData>({
  name: "Paginator",
  maxSize: 1000,
  defaultTTL: Timer(10).min(),
  cleanupInterval: Timer(1).min(),
  warningThreshold: 0.9,
});
