import { defineState } from "#utils";
import { z } from "zod";

/**
 * State for the like button initiated by the `/like` command.
 */
export const likeState = defineState(
  "like",
  z.object({
    authorId: z.string(),
    targetId: z.string(),
  }),
);
