import type { Message } from "discord.js";
import type { z } from "zod";
import type { Middleware } from "../shared/middleware.module.js";

export type FlagConfig<T extends z.ZodObject<any>> = {
  [K in keyof T["shape"]]?: {
    aliases?: string[];
    separator?: string;
  };
};

export interface FlagsObject<T extends z.ZodObject<any>> {
  schema: T;
  config?: FlagConfig<T>;
}

export interface PrefixCommand<T extends z.ZodObject<any> | undefined = undefined> {
  name: string;
  aliases?: string[];
  guilds?: string[];
  flags?: T extends z.ZodObject<any> ? FlagsObject<T> : undefined;
  middlewares?: Middleware<Message>[];
  run: (
    message: Message,
    args: T extends z.ZodObject<any> ? z.infer<T> : string[],
  ) => Promise<void> | void;
}
