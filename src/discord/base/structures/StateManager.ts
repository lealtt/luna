import { logger, Timer } from "#utils";

export interface StateEntry<T> {
  data: T;
  expiresAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface StateManagerOptions {
  maxSize?: number;
  defaultTTL?: number;
  cleanupInterval?: number;
  trackAccess?: boolean;
  warningThreshold?: number;
  name: string;
}

export class StateManager<T = any> {
  private store = new Map<string, StateEntry<T>>();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly options: Required<StateManagerOptions>;
  private cleanupCount = 0;
  private evictionCount = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: StateManagerOptions) {
    this.options = {
      maxSize: options.maxSize ?? 10000,
      defaultTTL: options.defaultTTL ?? Timer(1).hour(),
      cleanupInterval: options.cleanupInterval ?? Timer(5).min(),
      trackAccess: options.trackAccess ?? true,
      warningThreshold: options.warningThreshold ?? 0.8,
      name: options.name,
    };

    this.startCleanupTask();
  }

  public set(data: T, ttl?: number): string {
    const id = this.generateId();
    const expiresAt = Date.now() + (ttl ?? this.options.defaultTTL);

    // Check if we need to evict before adding
    if (this.store.size >= this.options.maxSize) {
      this.evictLRU();
    }

    this.store.set(id, {
      data,
      expiresAt,
      lastAccessed: Date.now(),
      accessCount: 0,
    });

    this.checkSizeWarning();
    return id;
  }

  public setWithId(id: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl ?? this.options.defaultTTL);

    // Evict if we're adding a new key and storage is full
    if (!this.store.has(id) && this.store.size >= this.options.maxSize) {
      this.evictLRU();
    }

    const entry = this.store.get(id);

    this.store.set(id, {
      data,
      expiresAt,
      lastAccessed: Date.now(),
      accessCount: entry ? entry.accessCount : 0, // Preserve access count if updating
    });

    this.checkSizeWarning();
  }

  public get(id: string): T | undefined {
    const entry = this.store.get(id);

    if (!entry) {
      this.missCount++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(id);
      this.missCount++;
      return undefined;
    }

    this.hitCount++;

    if (this.options.trackAccess) {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
    }

    return entry.data;
  }

  public update(id: string, data: Partial<T>): boolean {
    const entry = this.store.get(id);

    if (!entry || Date.now() > entry.expiresAt) {
      return false;
    }

    entry.data = { ...entry.data, ...data };
    entry.lastAccessed = Date.now();
    return true;
  }

  public delete(id: string): boolean {
    return this.store.delete(id);
  }

  public has(id: string): boolean {
    const entry = this.store.get(id);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(id);
      return false;
    }

    return true;
  }

  public touch(id: string, additionalTTL?: number): boolean {
    const entry = this.store.get(id);
    if (!entry) return false;

    entry.expiresAt = Date.now() + (additionalTTL ?? this.options.defaultTTL);
    entry.lastAccessed = Date.now();
    return true;
  }

  public cleanup(): number {
    const now = Date.now();
    const initialSize = this.store.size;
    let removed = 0;

    for (const [id, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.cleanupCount++;
      logger.debug(
        `[${this.options.name}] Cleanup #${this.cleanupCount}: removed ${removed} expired entries (${initialSize} → ${this.store.size})`,
      );
    }

    return removed;
  }

  private evictLRU(count: number = 1): number {
    if (this.store.size === 0) return 0;

    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let evicted = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.store.delete(entries[i][0]);
      evicted++;
      this.evictionCount++;
    }

    if (evicted > 0) {
      logger.warn(
        `[${this.options.name}] Evicted ${evicted} LRU entries (max size: ${this.options.maxSize})`,
      );
    }

    return evicted;
  }

  public clear(): void {
    const size = this.store.size;
    this.store.clear();
    logger.info(`[${this.options.name}] Cleared ${size} entries`);
  }

  public getStats() {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expiredCount++;
    }

    const hitRate =
      this.hitCount + this.missCount > 0
        ? (this.hitCount / (this.hitCount + this.missCount)) * 100
        : 0;

    return {
      size: this.store.size,
      maxSize: this.options.maxSize,
      utilization: (this.store.size / this.options.maxSize) * 100,
      expiredCount,
      cleanupRuns: this.cleanupCount,
      evictions: this.evictionCount,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: hitRate.toFixed(2) + "%",
    };
  }

  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);

    // Ensure cleanup runs on process exit
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  public stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  private checkSizeWarning(): void {
    const threshold = this.options.maxSize * this.options.warningThreshold;
    if (this.store.size >= threshold && this.store.size % 100 === 0) {
      logger.warn(
        `[${this.options.name}] Memory warning: ${this.store.size}/${this.options.maxSize} entries (${((this.store.size / this.options.maxSize) * 100).toFixed(1)}%)`,
      );
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  public getAllValid(): Map<string, T> {
    const now = Date.now();
    const valid = new Map<string, T>();

    for (const [id, entry] of this.store.entries()) {
      if (now <= entry.expiresAt) {
        valid.set(id, entry.data);
      }
    }

    return valid;
  }

  public destroy(): void {
    this.stopCleanup();
    const stats = this.getStats();
    logger.info(
      `[${this.options.name}] Destroyed - Final stats: ${stats.size} entries, ${stats.hitRate} hit rate, ${stats.evictions} evictions`,
    );
    this.clear();
  }
}
