import { logger } from "#utils";
import { Registry } from "../../structures/Registry.js";
import {
  ComponentTypeValidator,
  CustomIdValidator,
  RunFunctionValidator,
} from "../shared/validators.js";
import { ComponentInteractionType } from "./component.types.js";
import type { AnyComponent, Component, InteractionForType } from "./component.types.js";
import { z } from "zod";
import type { CacheType } from "discord.js";

class ComponentRegistry extends Registry<AnyComponent> {
  private static instance: ComponentRegistry;
  protected readonly registryName = "Component";
  public readonly nestedStore = new Map<string, Map<string, AnyComponent>>();

  protected constructor() {
    super();
  }

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  public getHandlerMap(key: string): Map<string, AnyComponent> | undefined {
    return this.nestedStore.get(key);
  }

  public register(item: AnyComponent): void {
    try {
      this.validate(item);
      const staticKey = item.customId.split("/")[0];
      if (!this.nestedStore.has(staticKey)) {
        this.nestedStore.set(staticKey, new Map<string, AnyComponent>());
      }
      const subMap = this.nestedStore.get(staticKey)!;
      if (subMap.has(item.customId)) {
        logger.warn(
          `Component with customId "${item.customId}" is already registered. It will be overwritten.`,
        );
      }
      subMap.set(item.customId, item);
      super.register(item);
    } catch (error) {
      logger.error(`Failed to register component "${item.customId}":`, error);
    }
  }

  protected postRegister(item: AnyComponent): void {
    if (!item.silent) {
      const typeName = ComponentInteractionType[item.type];
      logger.module(`Registered component: ${item.customId} (${typeName})`);
    }
  }

  protected validate(item: AnyComponent): void {
    const customIdValidator = new CustomIdValidator<AnyComponent>();
    const runFunctionValidator = new RunFunctionValidator<AnyComponent>();
    const typeValidator = new ComponentTypeValidator<AnyComponent>();
    customIdValidator.setNext(runFunctionValidator).setNext(typeValidator);
    customIdValidator.validate(item);
  }
}

export const componentRegistry = ComponentRegistry.getInstance();

export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
  const T_Schema extends z.ZodObject<any> | undefined,
  const C extends CacheType = "raw",
>(component: Component<T_ID, T_Type, T_Schema, C>): void {
  const componentToRegister: AnyComponent = {
    ...component,
    name: component.customId,
    run: (interaction, params) => {
      return component.run(interaction as InteractionForType<T_Type, C>, params as any);
    },
  };
  componentRegistry.register(componentToRegister);
}
