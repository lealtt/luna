import {
  type ColorResolvable,
  type APIEmbed,
  type APIEmbedAuthor,
  type APIEmbedFooter,
  EmbedBuilder,
} from "discord.js";

/**
 * Extended color type that includes Discord's ColorResolvable
 * and general string colors ("#00ffcc").
 */
export type FlexibleColor = ColorResolvable | (string & {});

/**
 * A custom, developer-friendly interface for an embed author.
 * Uses camelCase properties.
 */
interface LunaEmbedAuthor extends Omit<APIEmbedAuthor, "icon_url" | "proxy_icon_url"> {
  iconUrl?: string;
  proxyIconUrl?: string;
}

/**
 * A custom, developer-friendly interface for an embed footer.
 * Uses camelCase properties.
 */
interface LunaEmbedFooter extends Omit<APIEmbedFooter, "icon_url" | "proxy_icon_url"> {
  iconUrl?: string;
  proxyIconUrl?: string;
}

/**
 * A custom, developer-friendly interface for embed options.
 * This interface uses camelCase for properties and introduces 'images' for gallery support.
 */
export type LunaEmbedOptions = Omit<APIEmbed, "color" | "image" | "author" | "footer"> & {
  color?: FlexibleColor;
  images?: string | string[];
  author?: LunaEmbedAuthor | string;
  footer?: LunaEmbedFooter;
};

/**
 * Helper function to apply flexible color types to an EmbedBuilder.
 * @param embed The EmbedBuilder instance.
 * @param color The FlexibleColor to apply.
 */
function applyFlexibleColor(embed: EmbedBuilder, color: FlexibleColor) {
  if (typeof color === "string" && /^#?[0-9A-Fa-f]{6}$/.test(color)) {
    const hex = color.startsWith("#") ? color.slice(1) : color;
    embed.setColor(parseInt(hex, 16));
  } else {
    embed.setColor(color as ColorResolvable);
  }
}

/**
 * Recursively converts object keys from camelCase to snake_case.
 * This is used to transform our developer-friendly options into the format discord.js expects.
 * @param obj The object to convert.
 * @returns A new object with snake_case keys.
 */
function keysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnakeCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      (acc as any)[snakeKey] = keysToSnakeCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

/**
 * Creates an array of EmbedBuilders for a multi-image gallery.
 */
export function createEmbed(options: LunaEmbedOptions & { images: string[] }): EmbedBuilder[];
/**
 * Creates a single EmbedBuilder.
 */
export function createEmbed(options: LunaEmbedOptions): EmbedBuilder;
/**
 * A powerful factory function for creating one or more EmbedBuilders.
 * If 'images' is an array of URLs, it returns an array of embeds for a gallery.
 * @param options The developer-friendly options for the embed(s).
 * @returns A single EmbedBuilder or an array of EmbedBuilders.
 */
export function createEmbed(options: LunaEmbedOptions): EmbedBuilder | EmbedBuilder[] {
  const { images, color, ...rest } = options;

  // Convert our camelCase options to the snake_case APIEmbed format
  const apiOptions = keysToSnakeCase(rest) as APIEmbed;

  // Handle author being just a string
  if (typeof options.author === "string") apiOptions.author = { name: options.author };

  if (Array.isArray(images)) {
    const embeds: EmbedBuilder[] = [];
    const sharedUrl = apiOptions.url ?? "https://discord.com";

    images.forEach((imageUrl, index) => {
      const embed = new EmbedBuilder({
        ...apiOptions,
        url: sharedUrl,
      }).setImage(imageUrl);

      if (color) applyFlexibleColor(embed, color);
      if (index > 0) embed.setTitle(null).setDescription(null).setFields([]);

      embeds.push(embed);
    });

    return embeds;
  }

  const embed = new EmbedBuilder(apiOptions);

  if (color) applyFlexibleColor(embed, color);
  if (images) embed.setImage(images); // handles single string case

  return embed;
}
