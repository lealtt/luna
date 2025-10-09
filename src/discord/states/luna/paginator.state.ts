import { defineState } from "#utils";
import { z } from "zod";

// WARNING: DO NOT TOUCH THIS FILE!

/**
 * State for a paginator instance.
 * It now stores all the necessary data to render any page.
 */
export const paginatorState = defineState(
  "paginator",
  z.object({
    items: z.array(z.any()),
    itemsPerPage: z.number(),
    currentPage: z.number(),
    userId: z.string(),
    paginatorId: z.string(),
  }),
);
