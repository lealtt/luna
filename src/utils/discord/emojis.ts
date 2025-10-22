import { z } from "zod";
import { logger } from "../system/logger.js";
import rawEmojiConfig from "#emojisJson" with { type: "json" };

// Statically extract the literal keys from the raw JSON import for autocomplete.
type EmojiName = keyof typeof rawEmojiConfig.static | keyof typeof rawEmojiConfig.animated;

// Define the keys for the emoji map, falling back to "noEmojisAvailable" if empty.
type EmojiMapKeys = EmojiName extends never ? "noEmojisAvailable" : EmojiName;

// Zod schema for runtime validation with stricter snowflake validation.
const EmojiConfigSchema = z.object({
  static: z.record(
    z.string(),
    z.string().regex(/^\d+$/, "Static emoji IDs must be numeric snowflakes"),
  ),
  animated: z.record(
    z.string(),
    z.string().regex(/^\d+$/, "Animated emoji IDs must be numeric snowflakes"),
  ),
});

// Validate the imported JSON at runtime.
const validation = EmojiConfigSchema.safeParse(rawEmojiConfig);
const emojiConfig = validation.success ? validation.data : { static: {}, animated: {} };

if (!validation.success) {
  logger.warn(`emojis.json is invalid: ${JSON.stringify(validation.error.issues, null, 2)}`);
}

/**
 * Formats an emoji string for Discord.
 * @param name The emoji name
 * @param id The emoji ID
 * @param animated Whether the emoji is animated
 * @returns Formatted emoji string (e.g., <:name:id> or <a:name:id>)
 */
function formatEmoji(name: string, id: string, animated: boolean): string {
  return animated ? `<a:${name}:${id}>` : `<:${name}:${id}>`;
}

/**
 * Creates a strongly-typed emoji map from the validated configuration.
 * Memoized to avoid recomputation.
 */
const createEmojiMap = (() => {
  let cache: Record<string, string> | null = null;

  return (): Record<EmojiMapKeys, string> => {
    if (cache) return cache as Record<EmojiMapKeys, string>;

    const map: Record<string, string> = {};
    for (const name in emojiConfig.static) {
      map[name] = formatEmoji(name, emojiConfig.static[name], false);
    }
    for (const name in emojiConfig.animated) {
      map[name] = formatEmoji(name, emojiConfig.animated[name], true);
    }
    if (Object.keys(map).length === 0) {
      map["noEmojisAvailable"] = "🤷";
    }

    cache = map;
    return map as Record<EmojiMapKeys, string>;
  };
})();

// Export the memoized emoji map.
export const emojis = createEmojiMap();

/**
 * Utility to check if an emoji exists in the map.
 * @param name The emoji name to check
 * @returns True if the emoji exists
 */
export function hasEmoji(name: string): name is EmojiMapKeys {
  return name in emojis;
}

/**
 * Utility to get the raw emoji ID from the map.
 * @param name The emoji name
 * @returns The raw emoji ID or undefined if not found
 */
export function getEmojiId(name: string): string | undefined {
  const emoji = emojis[name as EmojiMapKeys];
  if (!emoji) return undefined;
  return emoji.match(/:(\d+)>$/)?.[1];
}
