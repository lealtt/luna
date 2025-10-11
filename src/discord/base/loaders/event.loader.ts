import type { Client } from "discord.js";
import { eventRegistry } from "#discord/registry";
import { logger } from "#utils";

/**
 * Registers all loaded events from the eventRegistry to the Discord client.
 * @param client The Discord client instance.
 */
export function registerClientEvents(client: Client): void {
  for (const event of eventRegistry.values()) {
    // Create a generic handler for the event's run function
    const handler = (...args: unknown[]) => event.run(...(args as []));

    // Attach the handler using 'once' or 'on' based on the event's configuration
    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }

  logger.event(`Loaded ${eventRegistry.size} events.`);
}
