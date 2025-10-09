import { defineState } from "#utils";
import { z } from "zod";
import { Locale } from "discord.js";

// WARNING: DO NOT TOUCH THIS FILE!

/**
 * State to cache the last known locale of a user.
 */
export const userLocaleState = defineState(
  "userLocale",
  z.object({
    locale: z.enum(Locale),
  }),
);
