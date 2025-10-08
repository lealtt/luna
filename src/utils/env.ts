import { z, ZodError } from "zod";
import { logger } from "./logger.js";

/**
 * Defines the schema for environment variables using Zod.
 * This ensures that all required environment variables are present and correctly typed.
 */
export const envSchema = z.object({
  BOT_TOKEN: z.string({ error: "BOT_TOKEN is required" }),
  MONGO_URI: z.string({ error: "MONGO_URI is required" }),
  MONGO_CERTIFICATE_PATH: z.string().optional(),
  LOG_CHANNEL_ID: z.string().optional(),
});

/**
 * The inferred type from the envSchema.
 * Provides static typing for the environment variables.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates the current environment variables against the defined schema.
 * If validation fails, it logs the specific errors and exits the application process.
 * @returns The validated and typed environment variables.
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((issue) => issue.message).join("\n - ");
      logger.error("Environment variable validation failed:\n - " + messages);
    } else {
      logger.error("An unexpected error occurred during environment variable validation.", err);
    }
    process.exit(1);
  }
}

/**
 * The validated and parsed environment variables object.
 * This constant is exported and can be safely used throughout the application.
 */
export const env = validateEnv();
