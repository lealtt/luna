import {
  type ModalSubmitInteraction,
  type ButtonInteraction,
  type MessageComponentInteraction,
  type ChannelSelectMenuInteraction,
  type MentionableSelectMenuInteraction,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserSelectMenuInteraction,
  type CacheType,
  type InteractionResponse,
} from "discord.js";
import type { z } from "zod";
import { logger } from "#utils";

// Types and Interfaces
export enum ComponentInteractionType {
  Button,
  StringSelect,
  UserSelect,
  RoleSelect,
  MentionableSelect,
  ChannelSelect,
  Modal,
}

type ExtractParamKeys<T extends string> = T extends `${string}{${infer P}}${infer R}`
  ? P | ExtractParamKeys<R>
  : never;

type ExtractParams<T extends string> =
  ExtractParamKeys<T> extends never
    ? Record<string, string>
    : { [K in ExtractParamKeys<T>]: string };

export type InteractionForType<
  T extends ComponentInteractionType,
  C extends CacheType = CacheType,
> = T extends ComponentInteractionType.Modal
  ? ModalSubmitInteraction<C>
  : T extends ComponentInteractionType.Button
    ? ButtonInteraction<C>
    : T extends ComponentInteractionType.StringSelect
      ? StringSelectMenuInteraction<C>
      : T extends ComponentInteractionType.UserSelect
        ? UserSelectMenuInteraction<C>
        : T extends ComponentInteractionType.RoleSelect
          ? RoleSelectMenuInteraction<C>
          : T extends ComponentInteractionType.ChannelSelect
            ? ChannelSelectMenuInteraction<C>
            : T extends ComponentInteractionType.MentionableSelect
              ? MentionableSelectMenuInteraction<C>
              : MessageComponentInteraction<C>;

interface BaseComponent<
  T_ID extends string,
  T_Type extends ComponentInteractionType,
  C extends CacheType,
> {
  customId: T_ID;
  type: T_Type | T_Type[];
  cached?: C;
  silent?: boolean;
}

interface ComponentWithSchema<
  T_ID extends string,
  T_Type extends ComponentInteractionType,
  T_Schema extends z.ZodObject<any>,
  C extends CacheType,
> extends BaseComponent<T_ID, T_Type, C> {
  paramsSchema: T_Schema;
  run: (
    interaction: InteractionForType<T_Type, C>,
    params: z.infer<T_Schema>,
  ) => Promise<InteractionResponse<boolean> | void>;
}

interface ComponentWithoutSchema<
  T_ID extends string,
  T_Type extends ComponentInteractionType,
  C extends CacheType,
> extends BaseComponent<T_ID, T_Type, C> {
  paramsSchema?: never;
  run: (
    interaction: InteractionForType<T_Type, C>,
    params: ExtractParams<T_ID>,
  ) => Promise<InteractionResponse<boolean> | void>;
}

export type Component<
  T_ID extends string = string,
  T_Type extends ComponentInteractionType = ComponentInteractionType,
  T_Schema extends z.ZodObject<any> | undefined = undefined,
  C extends CacheType = CacheType,
> =
  T_Schema extends z.ZodObject<any>
    ? ComponentWithSchema<T_ID, T_Type, T_Schema, C>
    : ComponentWithoutSchema<T_ID, T_Type, C>;

export type AnyComponent = Component<
  string,
  ComponentInteractionType,
  z.ZodObject<any> | undefined,
  CacheType
>;

export const componentRegistry = new Map<string, Map<string, AnyComponent>>();

/**
 * Registers a component in the registry with validation and logging.
 * @param component The component to register.
 */
export function registerComponent(component: AnyComponent): void {
  if (!component.customId) {
    throw new Error("Component validation failed: customId cannot be empty.");
  }

  if (typeof component.run !== "function") {
    throw new Error(`Component "${component.customId}" must have a valid run function.`);
  }

  if (
    component.type === null ||
    component.type === undefined ||
    (Array.isArray(component.type) && component.type.length === 0)
  ) {
    throw new Error(`Component "${component.customId}" must specify a valid type.`);
  }

  if (component.cached && component.cached !== "cached" && component.cached !== "raw") {
    throw new Error(
      `Component validation failed: Invalid cached value "${component.cached}" for component "${component.customId}". Must be "cached" or "raw".`,
    );
  }

  const staticKey = component.customId.split("/")[0];

  if (!staticKey) {
    throw new Error(
      `Component validation failed: Could not determine a static key for customId "${component.customId}".`,
    );
  }

  if (!componentRegistry.has(staticKey)) {
    componentRegistry.set(staticKey, new Map<string, AnyComponent>());
  }

  const subMap = componentRegistry.get(staticKey)!;

  if (subMap.has(component.customId)) {
    throw new Error(
      `Component with exact customId "${component.customId}" is already registered under the key "${staticKey}".`,
    );
  }

  subMap.set(component.customId, component);

  // Only log if the component is not marked as silent
  if (!component.silent) {
    const typeName = Array.isArray(component.type)
      ? component.type.map((t) => ComponentInteractionType[t]).join(" | ")
      : ComponentInteractionType[component.type];
    logger.module(`Registered component: ${component.customId} (${typeName})`);
  }
}

/**
 * A type-safe factory function for creating and registering a new component handler.
 * @param component The component configuration object.
 */
export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
  const T_Schema extends z.ZodObject<any> | undefined,
  const C extends CacheType = "raw",
>(component: Component<T_ID, T_Type, T_Schema, C>): void {
  try {
    registerComponent(component as unknown as AnyComponent);
  } catch (error) {
    logger.error(`Failed to register component "${component.customId}":`, error);
  }
}
