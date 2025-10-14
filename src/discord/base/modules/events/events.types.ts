import type { ClientEvents } from "discord.js";

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  silent?: boolean;
  run: (...args: ClientEvents[K]) => any | Promise<any>;
}

export type AnyEvent = {
  name: keyof ClientEvents;
  once?: boolean;
  silent?: boolean;
  run: (...args: unknown[]) => any | Promise<any>;
};
