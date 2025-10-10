import { logger } from "../system/logger.js";
import settings from "#settings" with { type: "json" };
import { z } from "zod";

/**
 * Statically defines the ColorName type directly from the import
 */
type ColorName = keyof typeof settings.color;

/**
 * Defines the Zod schema for runtime validation of the settings.json file.
 */
const SettingsSchema = z.object({
  color: z.record(
    z.string(),
    z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid #rrggbb hex code"),
  ),
});

/**
 * Validates the imported settings.json at runtime.
 */
const validation = SettingsSchema.safeParse(settings);
if (!validation.success) {
  logger.warn(
    "settings.json is invalid or missing a valid 'color' property. The colors utility will be limited.",
  );
}

const sourceColors = validation.success ? validation.data.color : {};

/**
 * Processes the raw color strings into a structured object.
 * @param config The raw color object from settings.json.
 * @returns An object where each color key maps to an object with hex and num properties.
 */
function processColors(config: Record<string, string>) {
  const processed: Record<string, { hex: string; num: number }> = {};
  for (const key in config) {
    const hex = config[key];
    processed[key] = {
      hex: hex,
      num: parseInt(hex.slice(1), 16),
    };
  }
  return processed;
}

/**
 * A strongly-typed object to access colors defined in settings.json.
 * Each color provides both a `hex` string and a `num` number value.
 *
 * @example
 * embed.setColor(colors.primary.num);
 * console.log(`The hex is ${colors.primary.hex}`);
 */
export const colors = processColors(sourceColors) as Record<
  ColorName,
  { hex: string; num: number }
>;
