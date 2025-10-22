import type {
  ApplicationCommandType,
  ApplicationIntegrationType,
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageContextMenuCommandInteraction,
  PermissionsString,
  UserContextMenuCommandInteraction,
  APIApplicationCommandAttachmentOption,
  APIApplicationCommandBooleanOption,
  APIApplicationCommandChannelOption,
  APIApplicationCommandIntegerOption,
  APIApplicationCommandMentionableOption,
  APIApplicationCommandNumberOption,
  APIApplicationCommandRoleOption,
  APIApplicationCommandStringOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  APIApplicationCommandUserOption,
} from "discord.js";
import type { Middleware } from "../shared/middleware.module.js";

type IsStrictlyGuildOnly<T extends readonly InteractionContextType[] | undefined> =
  T extends readonly [InteractionContextType.Guild] ? true : false;

export type InteractionByType<
  T extends ApplicationCommandType,
  TContexts extends readonly InteractionContextType[] | undefined,
> = T extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction<IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw">
  : T extends ApplicationCommandType.User
    ? UserContextMenuCommandInteraction<
        IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
      >
    : T extends ApplicationCommandType.Message
      ? MessageContextMenuCommandInteraction<
          IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
        >
      : never;

export type AutocompleteHandler<TContexts extends readonly InteractionContextType[] | undefined> = (
  interaction: AutocompleteInteraction<
    IsStrictlyGuildOnly<TContexts> extends true ? "cached" : "raw"
  >,
) => any | Promise<any>;

type ForbiddenLocalizationFields = "name_localizations" | "description_localizations";
type CamelCase<T> = {
  [K in keyof T as K extends `${infer Prefix}_length`
    ? `${Prefix}Length`
    : K extends `${infer Prefix}_value`
      ? `${Prefix}Value`
      : K]: T[K];
};

type StringOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandStringOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
type IntegerOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandIntegerOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
type NumberOption<TContexts extends readonly InteractionContextType[] | undefined> = CamelCase<
  Omit<APIApplicationCommandNumberOption, ForbiddenLocalizationFields>
> & { onAutocomplete?: AutocompleteHandler<TContexts> };
type BooleanOption = Omit<APIApplicationCommandBooleanOption, ForbiddenLocalizationFields>;
type UserOption = Omit<APIApplicationCommandUserOption, ForbiddenLocalizationFields>;
type ChannelOption = Omit<
  APIApplicationCommandChannelOption,
  ForbiddenLocalizationFields | "channel_types"
> & {
  channelTypes?: ChannelType[];
};
type RoleOption = Omit<APIApplicationCommandRoleOption, ForbiddenLocalizationFields>;
type MentionableOption = Omit<APIApplicationCommandMentionableOption, ForbiddenLocalizationFields>;
type AttachmentOption = Omit<APIApplicationCommandAttachmentOption, ForbiddenLocalizationFields>;
type BasicCommandOption<TContexts extends readonly InteractionContextType[] | undefined> =
  | StringOption<TContexts>
  | IntegerOption<TContexts>
  | NumberOption<TContexts>
  | BooleanOption
  | UserOption
  | ChannelOption
  | RoleOption
  | MentionableOption
  | AttachmentOption;
type SubcommandOption<TContexts extends readonly InteractionContextType[] | undefined> = Omit<
  APIApplicationCommandSubcommandOption,
  ForbiddenLocalizationFields | "options"
> & { options?: BasicCommandOption<TContexts>[] };
type SubcommandGroupOption<TContexts extends readonly InteractionContextType[] | undefined> = Omit<
  APIApplicationCommandSubcommandGroupOption,
  ForbiddenLocalizationFields | "options"
> & { options?: SubcommandOption<TContexts>[] };
export type CommandOption<
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BasicCommandOption<TContexts> | SubcommandOption<TContexts> | SubcommandGroupOption<TContexts>;

interface BaseCommand<
  T extends ApplicationCommandType,
  TContexts extends readonly InteractionContextType[] | undefined,
> {
  type: T;
  guilds?: string[];
  middlewares?: Middleware<InteractionByType<T, TContexts>>[];
  defaultMemberPermissions?: (PermissionsString | bigint)[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: TContexts;
  run: (interaction: InteractionByType<T, TContexts>) => any | Promise<any>;
}

export type ChatInputCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.ChatInput, TContexts> & {
  name: TName;
  description: string;
  options?: CommandOption<TContexts>[];
};
export type UserContextMenuCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.User, TContexts> & { name: TName };
export type MessageContextMenuCommand<
  TName extends string = string,
  TContexts extends readonly InteractionContextType[] | undefined = undefined,
> = BaseCommand<ApplicationCommandType.Message, TContexts> & { name: TName };
export type AnyCommand = ChatInputCommand | UserContextMenuCommand | MessageContextMenuCommand;

export type AnyCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

export type StorableCommand = {
  type: ApplicationCommandType;
  name: string;
  guilds?: string[];
  defaultMemberPermissions?: (PermissionsString | bigint)[];
  nsfw?: boolean;
  integrationTypes?: ApplicationIntegrationType[];
  contexts?: readonly InteractionContextType[];
  description?: string;
  options?: CommandOption<any>[];
  run: (interaction: AnyCommandInteraction) => any | Promise<any>;
  middlewares?: Middleware<any>[];
};
