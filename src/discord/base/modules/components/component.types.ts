import type {
  ModalSubmitInteraction,
  ButtonInteraction,
  MessageComponentInteraction,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  CacheType,
  InteractionResponse,
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

export type AnyInteraction =
  | ModalSubmitInteraction<CacheType>
  | ButtonInteraction<CacheType>
  | StringSelectMenuInteraction<CacheType>
  | UserSelectMenuInteraction<CacheType>
  | RoleSelectMenuInteraction<CacheType>
  | MentionableSelectMenuInteraction<CacheType>
  | ChannelSelectMenuInteraction<CacheType>;

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
  type: T_Type;
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

export type AnyComponent = {
  name: string;
  customId: string;
  type: ComponentInteractionType;
  cached?: CacheType;
  silent?: boolean;
  paramsSchema?: z.ZodObject<any>;
  run: (interaction: AnyInteraction, params: Record<string, any>) => Promise<any>;
};
