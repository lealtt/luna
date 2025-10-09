import { promises as fs } from "node:fs";
import path from "node:path";
import { fetchApplicationEmojis, type EmojiOutput } from "../api/discord.js";
import { logger } from "#utils";

const destinationEmojisPath = path.resolve(process.cwd(), "emojis.json");

export async function generateJsonCommand() {
  const emojis = await fetchApplicationEmojis();

  if (emojis.length === 0) {
    logger.info("no application emojis found to generate the file.");
    return;
  }

  logger.info(`found ${emojis.length} emojis. generating json file...`);

  const output: EmojiOutput = {
    static: {},
    animated: {},
  };

  emojis.forEach((emoji) => {
    if (emoji.animated) {
      output.animated[emoji.name] = emoji.id;
    } else {
      output.static[emoji.name] = emoji.id;
    }
  });

  try {
    const jsonContent = JSON.stringify(output, null, 2);
    await fs.writeFile(destinationEmojisPath, jsonContent);

    logger.success(`successfully generated emojis.json at ${destinationEmojisPath}`);
  } catch (err) {
    logger.error(`failed to generate emojis.json: ${(err as Error).message}`);
    process.exit(1);
  }
}
