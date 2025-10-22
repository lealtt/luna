import { z } from "zod";
import { logger } from "#utils";
import { env } from "#env";

const { BOT_TOKEN, CLIENT_ID } = env;

const api = {
  baseURL: "https://discord.com/api/v10",
  endpoints: {
    applicationEmojis: (appId: string | undefined) => `/applications/${appId}/emojis`,
    applicationEmoji: (appId: string | undefined, emojiId: string) =>
      `/applications/${appId}/emojis/${emojiId}`,
  },
};

const EmojiSchema = z.object({
  id: z.string(),
  name: z.string(),
  animated: z.boolean(),
});

const ApiResponseSchema = z.object({
  items: z.array(EmojiSchema),
});

const UploadPayloadSchema = z.object({
  name: z.string().min(2).max(32),
  image: z.string().startsWith("data:image/"),
});

export const EmojiOutputSchema = z.object({
  static: z.record(z.string(), z.string()),
  animated: z.record(z.string(), z.string()),
});

export type EmojiOutput = z.infer<typeof EmojiOutputSchema>;
export type DiscordEmoji = z.infer<typeof EmojiSchema>;
export type EmojiUploadPayload = z.infer<typeof UploadPayloadSchema>;

function logZodError(error: z.ZodError) {
  error.issues.forEach((issue) => {
    logger.error(`  Path: ${issue.path.join(".") || "root"}, Message: ${issue.message}`);
  });
}

export async function fetchApplicationEmojis(): Promise<DiscordEmoji[]> {
  const url = `${api.baseURL}${api.endpoints.applicationEmojis(CLIENT_ID)}`;
  logger.info("fetching and validating application emojis...");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bot ${BOT_TOKEN}` },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const validationResult = ApiResponseSchema.safeParse(data);

    if (!validationResult.success) {
      logger.error("zod validation failed:");
      logZodError(validationResult.error);
      return [];
    }

    logger.success("validation successful!");
    return validationResult.data.items;
  } catch (err) {
    logger.error(`failed to fetch emojis: ${(err as Error).message}`);
    return [];
  }
}

export async function uploadApplicationEmoji(
  payload: EmojiUploadPayload,
): Promise<DiscordEmoji | null> {
  const url = `${api.baseURL}${api.endpoints.applicationEmojis(CLIENT_ID)}`;

  const validationResult = UploadPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    logger.error("zod validation failed for upload payload:");
    logZodError(validationResult.error);
    return null;
  }

  logger.info(`uploading: ${payload.name}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bot ${BOT_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API error (${response.status}): ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const emojiValidationResult = EmojiSchema.safeParse(data);

    if (!emojiValidationResult.success) {
      logger.error("zod validation failed for upload response:");
      logZodError(emojiValidationResult.error);
      return null;
    }

    logger.success(`uploaded: ${emojiValidationResult.data.name}`);
    return emojiValidationResult.data;
  } catch (err) {
    logger.error(`failed to upload ${payload.name}: ${(err as Error).message}`);
    return null;
  }
}

export async function deleteApplicationEmoji(emojiId: string): Promise<boolean> {
  const url = `${api.baseURL}${api.endpoints.applicationEmoji(CLIENT_ID, emojiId)}`;
  logger.info(`deleting emoji: ${emojiId}`);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        authorization: `Bot ${BOT_TOKEN}`,
      },
    });

    if (response.status === 204) {
      logger.success(`successfully deleted emoji: ${emojiId}`);
      return true;
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(`API error (${response.status}): ${JSON.stringify(error)}`);
  } catch (err) {
    logger.error(`failed to delete emoji ${emojiId}: ${(err as Error).message}`);
    return false;
  }
}
