import type { ClientEvents } from "discord.js";

export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  run: (...args: ClientEvents[K]) => any | Promise<any>;
}

export const eventRegistry = new Map<keyof ClientEvents, Event<any>>();

export function registerEvent<K extends keyof ClientEvents>(event: Event<K>) {
  eventRegistry.set(event.name, event);
}
