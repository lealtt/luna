import {
  type ModalSubmitInteraction,
  type ButtonInteraction,
  type AnySelectMenuInteraction,
  type MessageComponentInteraction,
} from "discord.js";
import type { z } from "zod";

export enum ComponentInteractionType {
  Button,
  StringSelect,
  UserSelect,
  RoleSelect,
  MentionableSelect,
  ChannelSelect,
  Modal,
}

/**
 * A helper type that extracts the names of the parameters (e.g., "action" | "id")
 * from a custom ID string like "user/{action}/{id}".
 */
type ExtractParamKeys<T extends string> = T extends `${string}{${infer P}}${infer R}`
  ? P | ExtractParamKeys<R>
  : never;

/**
 * A robust type that creates an object from the extracted parameter keys,
 * mapping each key to a `string` type.
 */
type ExtractParams<T extends string> = {
  [K in ExtractParamKeys<T>]: string;
};

/**
 * Infers the correct discord.js interaction type from our custom enum.
 */
type InteractionForType<T extends ComponentInteractionType> =
  T extends ComponentInteractionType.Modal
    ? ModalSubmitInteraction
    : T extends ComponentInteractionType.Button
      ? ButtonInteraction
      : T extends
            | ComponentInteractionType.StringSelect
            | ComponentInteractionType.UserSelect
            | ComponentInteractionType.RoleSelect
            | ComponentInteractionType.MentionableSelect
            | ComponentInteractionType.ChannelSelect
        ? AnySelectMenuInteraction
        : MessageComponentInteraction;

/**
 * Base interface with common properties for all components.
 */
interface BaseComponent<T_ID extends string, T_Type extends ComponentInteractionType> {
  customId: T_ID;
  type: T_Type | T_Type[];
}

/**
 * Component WITH a schema. `params` are inferred from Zod.
 */
export interface ComponentWithSchema<
  T_ID extends string,
  T_Type extends ComponentInteractionType,
  T_Schema extends z.ZodObject<any>,
> extends BaseComponent<T_ID, T_Type> {
  paramsSchema: T_Schema;
  run: (interaction: InteractionForType<T_Type>, params: z.infer<T_Schema>) => any | Promise<any>;
}

/**
 * Component WITHOUT a schema. `params` provides autocomplete and has a safe fallback.
 */
export interface ComponentWithoutSchema<
  T_ID extends string,
  T_Type extends ComponentInteractionType,
> extends BaseComponent<T_ID, T_Type> {
  paramsSchema?: never; // Ensures a schema cannot be passed here
  run: (
    interaction: InteractionForType<T_Type>,
    params: Record<string, string | undefined> & ExtractParams<T_ID>,
  ) => any | Promise<any>;
}

/**
 * A conditional type that represents either version of the component.
 */
export type Component<
  T_ID extends string = string,
  T_Type extends ComponentInteractionType = ComponentInteractionType,
  T_Schema extends z.ZodObject<any> | undefined = undefined,
> =
  T_Schema extends z.ZodObject<any>
    ? ComponentWithSchema<T_ID, T_Type, T_Schema>
    : ComponentWithoutSchema<T_ID, T_Type>;

/** A generic type representing any component, used for the registry Map. */
export type AnyComponent = Component<
  string,
  ComponentInteractionType,
  z.ZodObject<any> | undefined
>;

/** Component registry */
export const componentRegistry = new Map<string, AnyComponent>();

/** Register a component */
export function registerComponent(component: AnyComponent) {
  componentRegistry.set(component.customId, component);
}
