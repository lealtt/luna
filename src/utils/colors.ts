import { z } from "zod";
import { logger } from "./logger.js";
import settings from "#settings" with { type: "json" };

// Statically extract the literal keys from the raw JSON import for autocompletion.
type ColorName = keyof typeof settings.color;

// Define the Zod schema for runtime validation.
// This ensures the JSON structure is correct when the application runs.
const SettingsSchema = z.object({
  color: z.record(z.string(), z.string().startsWith("#")),
});

// Validate the imported JSON at runtime.
const validation = SettingsSchema.safeParse(settings);

// Prepare the color object for export.
// If validation succeeds, use the colors from the file.
// Otherwise, use an empty object and log a warning.
const colorConfig = validation.success ? validation.data.color : {};

// Handle validation failures.
if (!validation.success) {
  logger.warn(
    "settings.json is invalid or missing the 'color' property. The colors utility will have limited functionality.",
  );
}

/**
 * A strongly-typed object to access colors defined in settings.json.
 * Provides autocompletion for color names.
 *
 * @example
 * import { colors } from "#utils";
 *
 * const embed = createEmbed({
 * color: colors.primary, // Access the primary color
 * description: "This is a success message!",
 * });
 */
export const colors: Record<ColorName, string> = colorConfig;
