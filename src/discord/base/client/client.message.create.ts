import { createEvent } from "#discord/creators";
import { Events } from "discord.js";
import { handlePrefixCommand } from "#discord/handlers";

/**
 * Handles the MessageCreate event to process prefix commands.
 */
createEvent({
  name: Events.MessageCreate,
  async run(message) {
    await handlePrefixCommand(message);
  },
});
