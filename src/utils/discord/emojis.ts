import { z } from "zod";
import { logger } from "../system/logger.js";
import rawEmojiConfig from "#emojis" with { type: "json" };

// Statically extract the literal keys from the raw JSON import.
// This is what TypeScript's language server uses for autocomplete.
type EmojiName = keyof typeof rawEmojiConfig.static | keyof typeof rawEmojiConfig.animated;

// Define a type for our final map's keys.
// If no emojis are found in the JSON, the only valid key is "noEmojisAvailable".
type EmojiMapKeys = EmojiName extends never ? "noEmojisAvailable" : EmojiName;

// Define the Zod schema for runtime validation.
const EmojiConfigSchema = z.object({
  static: z.record(z.string(), z.string()),
  animated: z.record(z.string(), z.string()),
});

// Validate the imported JSON at runtime.
const validation = EmojiConfigSchema.safeParse(rawEmojiConfig);
const emojiConfig = validation.success ? validation.data : { static: {}, animated: {} };

if (!validation.success) {
  logger.warn("emojis.json is invalid or empty. Emoji helper will have limited functionality.");
}

/**
 * A function to create the simple, strongly-typed object for accessing emoji strings.
 */
function createEmojiMap() {
  const map: Record<string, string> = {};

  for (const name in emojiConfig.static) map[name] = `<:${name}:${emojiConfig.static[name]}>`;
  for (const name in emojiConfig.animated) map[name] = `<a:${name}:${emojiConfig.animated[name]}>`;
  if (Object.keys(map).length === 0) map["noEmojisAvailable"] = "🤷";

  return map;
}

// Export the final object, casting it to our specific Record type.
export const emojis: Record<EmojiMapKeys, string> = createEmojiMap();
