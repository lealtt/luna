import { BaseValidator } from "#discord/structures";

export class NameValidator<T extends { name: string }> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (!item.name || typeof item.name !== "string" || item.name.trim() === "") {
      throw new Error("Validation failed: item must have a non-empty name.");
    }
  }
}

export class RunFunctionValidator<
  T extends { run: unknown; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (typeof item.run !== "function") {
      throw new Error(`Validation failed: item "${item.name}" must have a valid run function.`);
    }
  }
}

export class TaskScheduleValidator<
  T extends { cron?: string; interval?: number; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (!item.cron && !item.interval) {
      throw new Error(
        `Validation failed: task "${item.name}" must have either a 'cron' or 'interval' property.`,
      );
    }
  }
}

export class AliasesValidator<
  T extends { aliases?: string[]; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (item.aliases?.some((alias) => !alias || alias === item.name)) {
      throw new Error(
        `Validation failed: Invalid aliases for command "${item.name}". Aliases must be non-empty and distinct from the command name.`,
      );
    }
  }
}

export class GuildIdsValidator<
  T extends { guilds?: string[]; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (item.guilds?.some((id) => !/^\d+$/.test(id))) {
      throw new Error(
        `Validation failed: Invalid guild ID in command "${item.name}". Guild IDs must be numeric.`,
      );
    }
  }
}

export class CustomIdValidator<
  T extends { customId: string; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (!item.customId || typeof item.customId !== "string" || item.customId.trim() === "") {
      throw new Error(`Validation failed: item "${item.name}" must have a non-empty customId.`);
    }
    const staticKey = item.customId.split("/")[0];
    if (!staticKey) {
      throw new Error(
        `Validation failed: Could not determine a static key for customId "${item.customId}".`,
      );
    }
  }
}

export class ComponentTypeValidator<
  T extends { type: unknown; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (
      item.type === null ||
      item.type === undefined ||
      (Array.isArray(item.type) && item.type.length === 0)
    ) {
      throw new Error(`Validation failed: component "${item.name}" must specify a valid type.`);
    }
  }
}
