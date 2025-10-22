import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  deleteApplicationEmoji,
  fetchApplicationEmojis,
  type DiscordEmoji,
} from "../api/discord.js";
import { logger } from "#utils";
import { kfeat } from "@lealt/kaori";

const rateLimitDelay = kfeat.timer.create(2).sec(); 

type EmojiQueue = ReturnType<typeof kfeat.queue.create<DiscordEmoji>>;

async function processDeleteQueue(
  queue: EmojiQueue,
  deletedCount: { value: number },
): Promise<void> {
  if (queue.isEmpty()) {
    logger.success(`Finished. Deleted ${deletedCount.value} emojis.`);
    return;
  }

  const emoji = queue.dequeue();
  if (!emoji) {
    logger.warn("Attempted to dequeue from an empty queue unexpectedly.");
    return;
  }

  const success = await deleteApplicationEmoji(emoji.id);
  if (success) {
    deletedCount.value++;
  }

  setTimeout(() => processDeleteQueue(queue, deletedCount), rateLimitDelay);
}

async function deleteAllEmojis(): Promise<void> {
  logger.warn("You are about to delete ALL application emojis.");

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question("Are you sure you want to continue? (y/N) ");
  rl.close();

  if (answer.toLowerCase() !== "y") {
    logger.info("Operation cancelled.");
    return;
  }

  const emojis = await fetchApplicationEmojis();
  if (emojis.length === 0) {
    logger.info("No emojis found to delete.");
    return;
  }

  logger.info(`Starting deletion of ${emojis.length} emojis...`);

  const emojiQueue = kfeat.queue.create<DiscordEmoji>();
  emojis.forEach((emoji) => emojiQueue.enqueue(emoji));

  processDeleteQueue(emojiQueue, { value: 0 });
}

async function deleteEmojisByIds(ids: string[]): Promise<void> {
  logger.info(`Starting deletion of ${ids.length} emojis by ID...`);

  const emojiQueue = kfeat.queue.create<DiscordEmoji>(); 
  ids.forEach((id) => emojiQueue.enqueue({ id, name: "unknown", animated: false }));

  processDeleteQueue(emojiQueue, { value: 0 });
}

export async function deleteCommand(emoji_ids: string[]) {
  if (emoji_ids.length === 0) {
    await deleteAllEmojis();
  } else {
    await deleteEmojisByIds(emoji_ids);
  }
}
