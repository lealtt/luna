import { logger } from "#utils";
import type { Client, ClientEvents } from "discord.js";

/**
 * Defines the structure of an event listener.
 */
export interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  silent?: boolean;
  run: (...args: ClientEvents[K]) => any | Promise<any>;
}

const eventRegistry = new Map<keyof ClientEvents, Event<any>>();

/**
 * Registers a new event to the registry and logs it if not silent.
 * @param event The event object to register.
 */
function registerEvent<K extends keyof ClientEvents>(event: Event<K>) {
  eventRegistry.set(event.name, event);

  // Only log if the event is not marked as silent
  if (!event.silent) {
    logger.module(`Registered event: ${event.name}`);
  }
}

/**
 * A factory function for creating and registering a new event listener.
 * @param options The event configuration.
 */
export function createEvent<K extends keyof ClientEvents>(options: Event<K>) {
  registerEvent(options);
}

/**
 * Registers all loaded events from the eventRegistry to the Discord client.
 * @param client The Discord client instance.
 */
export function registerClientEvents(client: Client): void {
  for (const event of eventRegistry.values()) {
    const handler = (...args: unknown[]) => event.run(...(args as []));

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }
}
