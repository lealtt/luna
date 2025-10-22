import { z, ZodError } from "zod";
import { logger } from "#utils";

const envSchema = z.object({
  BOT_TOKEN: z.string({ error: "BOT_TOKEN is required" }),
  CLIENT_ID: z.string({ error: "BOT_TOKEN is required" }),
  MONGO_URI: z.string({ error: "MONGO_URI is required" }),
  MONGO_CERTIFICATE_PATH: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

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

export const env = validateEnv();
