import { type ColorResolvable, type APIEmbed, EmbedBuilder } from "discord.js";

/**
 * Extended color type that includes Discord's ColorResolvable
 * and general string colors (e.g., "#00ffcc").
 */
export type FlexibleColor = ColorResolvable | (string & {});

/**
 * A more flexible type for embed options, now supporting a single URL or an array of URLs for the image.
 */
export type CreateEmbedOptions = Omit<APIEmbed, "color" | "image"> & {
  color?: FlexibleColor;
  image?: string | string[];
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
 * Creates an array of EmbedBuilders for a multi-image gallery.
 */
export function createEmbed(options: CreateEmbedOptions & { image: string[] }): EmbedBuilder[];
/**
 * Creates a single EmbedBuilder.
 */
export function createEmbed(options: CreateEmbedOptions): EmbedBuilder;
/**
 * A powerful factory function for creating one or more EmbedBuilders.
 * If 'image' is an array of URLs, it returns an array of embeds for a gallery.
 * @param options The options for the embed(s).
 * @returns A single EmbedBuilder or an array of EmbedBuilders.
 */
export function createEmbed(options: CreateEmbedOptions): EmbedBuilder | EmbedBuilder[] {
  const { image, color, ...rest } = options;

  if (Array.isArray(image)) {
    const embeds: EmbedBuilder[] = [];
    const sharedUrl = rest.url ?? "https://discord.com";

    image.forEach((imageUrl, index) => {
      const embed = new EmbedBuilder({
        ...rest,
        url: sharedUrl,
      }).setImage(imageUrl);

      if (color) applyFlexibleColor(embed, color);
      if (index > 0) embed.setTitle(null).setDescription(null).setFields([]);

      embeds.push(embed);
    });

    return embeds;
  }

  const embed = new EmbedBuilder(rest);

  if (color) applyFlexibleColor(embed, color);
  if (image) embed.setImage(image);

  return embed;
}
