import { type Component, registerComponent, ComponentInteractionType } from "#discord/registry";

/**
 * A simple factory function for creating and registering a new message component or modal handler.
 * @param options The component configuration.
 * @template T_ID - A string literal type for the custom ID, allowing for type-safe parameter extraction.
 * @template T_Type - The type of the component, ensuring the correct interaction type is used in the handler.
 */
export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
>(options: Component<T_ID, T_Type>) {
  registerComponent(options);
}
