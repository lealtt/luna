import { BaseValidator } from "../../structures/Validator.js";
import { SnowflakeUtil } from "discord.js";

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

    if (item.interval !== undefined && item.interval < 1000) {
      throw new Error(`Task "${item.name}" interval must be at least 1000ms (1 second)`);
    }
  }
}

export class AliasesValidator<
  T extends { aliases?: string[]; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (item.aliases?.some((alias) => !alias || alias === item.name)) {
      throw new Error(`Validation failed: Invalid aliases for command "${item.name}".`);
    }
  }
}

export class GuildIdsValidator<
  T extends { guilds?: string[]; name?: string },
> extends BaseValidator<T> {
  protected execute(item: T): void {
    if (!item.guilds) return;

    for (const id of item.guilds) {
      if (!/^[0-9]{17,20}$/.test(id)) {
        throw new Error(`Invalid guild ID in "${item.name}": ${id}`);
      }

      try {
        SnowflakeUtil.deconstruct(id);
      } catch {
        throw new Error(`Invalid snowflake for guild ID in "${item.name}": ${id}`);
      }
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

    if (item.customId.length > 100) {
      throw new Error(`Custom ID "${item.customId}" exceeds maximum length of 100 characters`);
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
