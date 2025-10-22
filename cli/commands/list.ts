import { fetchApplicationEmojis } from "../api/discord.js";
import { logger } from "#utils";

export async function listCommand() {
  const emojis = await fetchApplicationEmojis();

  if (emojis.length === 0) {
    logger.info("no application emojis found or failed to fetch.");
    return;
  }

  const emojiData = emojis.map((emoji) => {
    const prefix = emoji.animated ? "a" : "";
    return {
      name: emoji.name,
      id: emoji.id,
      animated: emoji.animated,
      string: `<${prefix}:${emoji.name}:${emoji.id}>`,
    };
  });

  console.log(JSON.stringify(emojiData, null, 2));
}
