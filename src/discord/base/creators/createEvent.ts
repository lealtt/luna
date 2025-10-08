import type { ClientEvents } from "discord.js";
import { type Event, registerEvent } from "#discord/registry";

/**
 * A simple factory function for creating and registering a new event listener.
 * @param options The event configuration, typed by the event name.
 * @template K - A key of ClientEvents, ensuring type safety for the event handler.
 */
export function createEvent<K extends keyof ClientEvents>(options: Event<K>) {
  registerEvent(options);
}
