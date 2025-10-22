import { logger } from "#utils";

export abstract class Registry<T extends { name: string }> {
  public readonly store = new Map<string, T>();
  protected abstract readonly registryName: string;

  protected constructor() {}

  protected validate(item: T): void {
    if (!item.name) {
      throw new Error(`${this.registryName} item validation failed: name cannot be empty.`);
    }
    if (this.store.has(item.name)) {
      logger.warn(
        `${this.registryName} item with name "${item.name}" is already registered. It will be overwritten.`,
      );
    }
  }

  protected postRegister(item: T): void {
    if (!(item as any).silent) {
      logger.module(`Registered ${this.registryName.toLowerCase()}: ${item.name}`);
    }
  }

  public register(item: T): void {
    try {
      this.validate(item);
      this.store.set(item.name, item);
      this.postRegister(item);
    } catch (error) {
      logger.error(`Failed to register ${this.registryName.toLowerCase()} "${item.name}":`, error);
    }
  }

  public get(name: string): T | undefined {
    return this.store.get(name);
  }

  public values(): IterableIterator<T> {
    return this.store.values();
  }
}
