import type { EmbedBuilder, User } from "discord.js";

export type PaginatorFormatPage<T> = (
  pageItems: T[],
  currentPage: number,
  totalPages: number,
) => EmbedBuilder;

export interface PaginatorOptions<T> {
  paginatorId: string;
  items: T[];
  itemsPerPage: number;
  user: User;
  formatPage: PaginatorFormatPage<T>;
  emojis?: Partial<{
    first: string;
    previous: string;
    home: string;
    next: string;
    last: string;
  }>;
}
