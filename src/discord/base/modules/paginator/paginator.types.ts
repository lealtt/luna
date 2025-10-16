import type { EmbedBuilder, User } from "discord.js";

export type PaginatorFormatPage<T> = (
  pageItems: T[],
  currentPage: number,
  totalPages: number,
) => EmbedBuilder;

export type PaginatorStyle = "buttons" | "menu" | "both";

export interface PaginatorMenuItem<T> {
  label: string;
  description?: string;
  emoji?: string;
  value?: string;
  items: T[];
}

export interface PaginatorOptions<T> {
  paginatorId: string;
  items: T[];
  itemsPerPage: number;
  user: User;
  formatPage: PaginatorFormatPage<T>;
  style?: PaginatorStyle;
  emojis?: Partial<{
    first: string;
    previous: string;
    home: string;
    next: string;
    last: string;
  }>;
  menuItems?: PaginatorMenuItem<T>[];
  menuPlaceholder?: string;
  timeout?: number;
  showPageIndicator?: boolean;
}

export interface PaginatorState<T> {
  items: T[];
  itemsPerPage: number;
  currentPage: number;
  userId: string;
  paginatorId: string;
  style: PaginatorStyle;
  menuItems?: PaginatorMenuItem<T>[];
  selectedMenuValue?: string;
  createdAt: number;
  lastInteraction: number;
  emojis?: Partial<{
    first: string;
    previous: string;
    home: string;
    next: string;
    last: string;
  }>;
  showPageIndicator: boolean;
}
