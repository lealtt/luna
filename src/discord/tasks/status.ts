import { createTask } from "#discord/modules";
import { kfeat } from "@lealt/kaori";
import { ActivityType, type ActivityOptions } from "discord.js";

const statusQueue = kfeat.queue.create<ActivityOptions>();
statusQueue.enqueue({ name: "Interstellar", type: ActivityType.Watching });
statusQueue.enqueue({ name: "Requests", type: ActivityType.Listening });
statusQueue.enqueue({ name: "Minecraft", type: ActivityType.Playing });

createTask({
  name: "update-status",
  interval: kfeat.timer.create(15).sec(),
  runImmediately: true,
  run(client) {
    const status = statusQueue.dequeue();
    if (!status) return;

    client.user?.setActivity(status);

    statusQueue.enqueue(status);
  },
});
