import { type Component, registerComponent, ComponentInteractionType } from "#discord/registry";
import type { z } from "zod";

/**
 * A simple factory function for creating and registering a new message component or modal handler.
 * @param options The component configuration.
 * @template T_ID - A string literal type for the custom ID, allowing for type-safe parameter extraction.
 * @template T_Type - The type of the component, ensuring the correct interaction type is used in the handler.
 * @template T_Schema - An optional Zod schema for validating the component's parameters.
 */
export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
  const T_Schema extends z.ZodObject<any> | undefined,
>(options: Component<T_ID, T_Type, T_Schema>) {
  registerComponent(options);
}
