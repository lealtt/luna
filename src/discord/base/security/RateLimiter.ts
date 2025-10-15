import { logger } from "#utils";

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export class RateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  isRateLimited(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    const now = Date.now();

    if (record.blockedUntil && now < record.blockedUntil) {
      return true;
    }

    if (now > record.resetAt) {
      this.attempts.delete(identifier);
      return false;
    }

    return record.count >= this.config.maxAttempts;
  }

  recordAttempt(identifier: string): {
    limited: boolean;
    remainingAttempts: number;
    resetAt: number;
  } {
    const now = Date.now();
    let record = this.attempts.get(identifier);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + this.config.windowMs,
      };
      this.attempts.set(identifier, record);
    } else {
      record.count++;

      if (record.count > this.config.maxAttempts && this.config.blockDurationMs) {
        record.blockedUntil = now + this.config.blockDurationMs;
        logger.warn(
          `Rate limit exceeded for ${identifier}, blocked for ${this.config.blockDurationMs}ms`,
        );
      }
    }

    return {
      limited: record.count > this.config.maxAttempts,
      remainingAttempts: Math.max(0, this.config.maxAttempts - record.count),
      resetAt: record.resetAt,
    };
  }

  getTimeUntilReset(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;

    const now = Date.now();

    if (record.blockedUntil && now < record.blockedUntil) {
      return record.blockedUntil - now;
    }

    return Math.max(0, record.resetAt - now);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
        this.attempts.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`RateLimiter: Cleaned up ${removed} expired entries`);
    }
  }

  getStats() {
    const now = Date.now();
    let active = 0;
    let blocked = 0;

    for (const record of this.attempts.values()) {
      if (now <= record.resetAt) {
        active++;
        if (record.blockedUntil && now < record.blockedUntil) {
          blocked++;
        }
      }
    }

    return { total: this.attempts.size, active, blocked };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.attempts.clear();
  }
}
