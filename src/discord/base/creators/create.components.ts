import {
  type Component,
  registerComponent,
  ComponentInteractionType,
  type AnyComponent,
} from "#discord/registry";
import type { CacheType } from "discord.js";
import type { z } from "zod";

/**
 * A simple factory function for creating and registering a new message component or modal handler.
 * @param options The component configuration.
 */

export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
  const T_Schema extends z.ZodObject<any>,
  const C extends CacheType = "raw",
>(options: Component<T_ID, T_Type, T_Schema, C>): void;

export function createComponent<
  const T_ID extends string,
  const T_Type extends ComponentInteractionType,
  const C extends CacheType = "raw",
  const T_Schema extends undefined = undefined,
>(options: Component<T_ID, T_Type, T_Schema, C>): void;

export function createComponent(options: AnyComponent) {
  registerComponent(options);
}
