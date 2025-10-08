import {
  type ModalSubmitInteraction,
  type ButtonInteraction,
  type AnySelectMenuInteraction,
  type MessageComponentInteraction,
} from "discord.js";

export enum ComponentInteractionType {
  Button,
  StringSelect,
  UserSelect,
  RoleSelect,
  MentionableSelect,
  ChannelSelect,
  Modal,
}

/** Parses a custom ID string like "user/{action}/{id}" into a typed object */
type ExtractParams<T extends string> = T extends `${string}{${infer P}}${infer R}`
  ? { [K in P]: string } & ExtractParams<R>
  : object;

/** Infers the correct discord.js interaction type from our custom enum */
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
 * A flexible, type-safe interface for a component or modal handler.
 */
export interface Component<
  T_ID extends string = string,
  T_Type extends ComponentInteractionType = ComponentInteractionType,
> {
  customId: T_ID;
  type: T_Type | T_Type[];
  run: (interaction: InteractionForType<T_Type>, params: ExtractParams<T_ID>) => any | Promise<any>;
}

/** Component registry */
export const componentRegistry = new Map<string, Component<string, any>>();

/** Register a component */
export function registerComponent<T_ID extends string, T_Type extends ComponentInteractionType>(
  component: Component<T_ID, T_Type>,
) {
  componentRegistry.set(component.customId, component);
}
