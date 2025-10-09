import type { EmbedBuilder } from "discord.js";

/**
 * Defines the shape of a function that formats a paginator page.
 */
export type PaginatorFormatPage<T> = (
  pageItems: T[],
  currentPage: number,
  totalPages: number,
) => EmbedBuilder;

/**
 * A registry to hold the format functions for different paginators.
 */
export const paginatorRegistry = new Map<string, PaginatorFormatPage<any>>();
