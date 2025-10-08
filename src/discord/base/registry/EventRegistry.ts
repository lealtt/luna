import type { ClientEvents } from "discord.js";

/** Defines the structure of an event listener. */
export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  run: (...args: ClientEvents[K]) => any | Promise<any>;
}

/** The central registry for all events. */
export const eventRegistry = new Map<keyof ClientEvents, Event<any>>();

/** Registers an event to the registry. */
export function registerEvent<K extends keyof ClientEvents>(event: Event<K>) {
  eventRegistry.set(event.name, event);
}
