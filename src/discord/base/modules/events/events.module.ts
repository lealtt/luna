import type { Client, ClientEvents } from "discord.js";
import { Registry } from "#discord/structures";
import { NameValidator, RunFunctionValidator } from "../shared/validators.js";
import type { AnyEvent, Event } from "./events.types.js";
import { emitBotEvent } from "#discord/hooks";
import { logger } from "#utils";

class EventRegistry extends Registry<AnyEvent> {
  private static instance: EventRegistry;
  protected readonly registryName = "Event";

  protected constructor() {
    super();
  }

  public static getInstance(): EventRegistry {
    if (!EventRegistry.instance) {
      EventRegistry.instance = new EventRegistry();
    }
    return EventRegistry.instance;
  }

  protected validate(item: AnyEvent): void {
    const nameValidator = new NameValidator<typeof item>();
    const runFunctionValidator = new RunFunctionValidator<typeof item>();

    nameValidator.setNext(runFunctionValidator);
    nameValidator.validate(item);

    super.validate(item);
  }
}

export const eventRegistry = EventRegistry.getInstance();

export function createEvent<K extends keyof ClientEvents>(options: Event<K>) {
  const eventToRegister: AnyEvent = {
    ...options,
    run: (...args: unknown[]) => options.run(...(args as ClientEvents[K])),
  };
  eventRegistry.register(eventToRegister);
}

export function registerClientEvents(client: Client): void {
  for (const event of eventRegistry.store.values()) {
    const handler = async (...args: unknown[]) => {
      try {
        await emitBotEvent(`event:${event.name}:beforeExecute`, client, { event, args });

        await event.run(...args);

        await emitBotEvent(`event:${event.name}:afterExecute`, client, { event, args });
      } catch (error) {
        await emitBotEvent(`event:${event.name}:error`, client, { event, args, error });
        logger.error(`Error executing event handler for "${event.name}":`, error);
      }
    };

    if (event.once) {
      client.once(event.name, handler);
    } else {
      client.on(event.name, handler);
    }
  }
}
