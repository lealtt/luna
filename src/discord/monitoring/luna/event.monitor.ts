import { onBotEvent } from "#discord/hooks";
import type { AnyEvent } from "#discord/modules";
import { logger } from "#utils";

onBotEvent(
  "event:interactionCreate:beforeExecute",
  ({ data }) => {
    const event = data.event as AnyEvent;
    logger.debug(`[EVENT][${event.name}] Processing interaction...`);
  },
  { name: "monitor-event-interaction", silent: true },
);

onBotEvent(
  "event:messageCreate:beforeExecute",
  ({ data }) => {
    const event = data.event as AnyEvent;
    logger.debug(`[EVENT][${event.name}] Processing message...`);
  },
  { name: "monitor-event-message", silent: true },
);

onBotEvent(
  "event:error:error",
  ({ data }) => {
    const event = data.event as AnyEvent;
    const error = data.error as Error;
    logger.error(`[EVENT][${event.name}] Handler Failed: ${error.message}`);
  },
  { name: "monitor-event-error", silent: true },
);
