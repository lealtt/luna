import { createTask } from "#discord/creators";
import { Timer, Queue } from "#utils";
import { ActivityType, type ActivityOptions } from "discord.js";

/**
 * A queue of activities for the bot to cycle through.
 * Using a Queue here demonstrates a FIFO (First-In, First-Out) pattern
 * where an activity is used and then re-added to the end of the line.
 */
const statusQueue = new Queue<ActivityOptions>();
statusQueue.enqueue({ name: "Interstellar", type: ActivityType.Watching });
statusQueue.enqueue({ name: "Requests", type: ActivityType.Listening });
statusQueue.enqueue({ name: "Minecraft", type: ActivityType.Playing });

createTask({
  name: "Update Status",
  interval: Timer(15).sec(),
  runImmediately: true,
  run(client) {
    // 1. Dequeue the next status from the front of the queue.
    const status = statusQueue.dequeue();
    if (!status) return; // Failsafe in case the queue is ever empty.

    // 2. Set the bot's activity.
    client.user?.setActivity(status);

    // 3. Enqueue the same status to the back of the queue to create the cycle.
    statusQueue.enqueue(status);
  },
});
