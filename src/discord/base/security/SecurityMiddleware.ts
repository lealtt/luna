import type { Middleware } from "../modules/shared/middleware.module.js";
import { RateLimiter } from "./RateLimiter.js";
import { logger, t, Timer } from "#utils";
import { Message, MessageFlags, time } from "discord.js";

const globalUserRateLimiter = new RateLimiter({
  maxAttempts: 30,
  windowMs: Timer(1).min(),
  blockDurationMs: Timer(1).min(),
});

export const rateLimitMiddleware: Middleware = async (context, next) => {
  const userId = "user" in context ? context.user.id : context.author.id;
  const identifier = `user:${userId}`;

  if (globalUserRateLimiter.isRateLimited(identifier)) {
    const timeRemainingMs = globalUserRateLimiter.getTimeUntilReset(identifier);
    const expiresAtTimestamp = Math.floor((Date.now() + timeRemainingMs) / 1000);

    const relativeTime = time(expiresAtTimestamp, "R");

    const message = t(
      "locale" in context ? context.locale : "en-US",
      "common_errors.rate_limited",
      { time: relativeTime },
    );

    if (context instanceof Message) {
      await context.reply({ content: message });
    } else {
      await context.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    }

    logger.warn(`User ${userId} hit global rate limit`);
    return;
  }

  globalUserRateLimiter.recordAttempt(identifier);
  await next();
};

process.on("exit", () => {
  globalUserRateLimiter.destroy();
});
