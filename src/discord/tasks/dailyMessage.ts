import { createTask } from "#discord/modules";
import { Cron, env, Finder, logger } from "#utils";

createTask({
  name: "Send Daily Good Morning Message",

  // Use the Cron helper to schedule the task.
  // This will run every day at 9:00 AM.
  cron: Cron.dailyAt(9, 0),

  async run(client) {
    if (!env.LOG_CHANNEL_ID) {
      logger.warn("Task 'Send Daily Good Morning Message' skipped: LOG_CHANNEL_ID is not defined.");
      return;
    }

    try {
      const channel = await Finder(client, env.LOG_CHANNEL_ID).channel().textChannel();

      if (channel) {
        await channel.send("Good morning! ☀️");
        logger.info(`Successfully sent daily message to channel: ${channel.name}`);
      }
    } catch (error) {
      logger.error("Failed to send daily good morning message:", error);
    }
  },
});
