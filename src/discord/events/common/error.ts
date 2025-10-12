import { createEvent } from "#discord/modules";
import { logger } from "#utils";
import { Events } from "discord.js";

createEvent({
  name: Events.Error,
  run(error) {
    logger.error(error.message);
  },
});
