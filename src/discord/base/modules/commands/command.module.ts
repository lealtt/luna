import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  type Client,
} from "discord.js";
import { NameValidator, RunFunctionValidator } from "../shared/validators.js";
import { DiscordApiFacade } from "./command.facade.js";
import type {
  AnyCommand,
  AnyCommandInteraction,
  AutocompleteHandler,
  StorableCommand,
  CommandOption,
  ChatInputCommand,
  UserContextMenuCommand,
  MessageContextMenuCommand,
} from "./command.types.js";
import { z } from "zod";
import { env } from "#utils";
import { Registry } from "#discord/structures";

const BaseCommandSchema = z.object({
  name: z.string().min(1, { message: "Command name cannot be empty." }),
  type: z.enum(ApplicationCommandType),
  guilds: z.array(z.string()).optional(),
  cooldown: z.number().positive().optional(),
  middlewares: z.array(z.function()).optional(),
  run: z.function(),
});

const ChatInputCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.ChatInput),
  description: z.string().min(1, { message: "ChatInput command must have a description." }),
  options: z.array(z.any()).optional(),
});

const UserContextMenuCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.User),
});

const MessageContextMenuCommandSchema = BaseCommandSchema.extend({
  type: z.literal(ApplicationCommandType.Message),
});

const AnyCommandSchema = z.discriminatedUnion("type", [
  ChatInputCommandSchema,
  UserContextMenuCommandSchema,
  MessageContextMenuCommandSchema,
]);

export const autocompleteRegistry = new Map<string, Map<string, AutocompleteHandler<any>>>();

function findAutocompleteHandlers(
  options: CommandOption<any>[],
  handlers: Map<string, AutocompleteHandler<any>>,
) {
  for (const option of options) {
    if ("onAutocomplete" in option && typeof option.onAutocomplete === "function") {
      handlers.set(option.name, option.onAutocomplete);
    }
    if (
      (option.type === ApplicationCommandOptionType.Subcommand ||
        option.type === ApplicationCommandOptionType.SubcommandGroup) &&
      option.options
    ) {
      findAutocompleteHandlers(option.options, handlers);
    }
  }
}

class CommandRegistry extends Registry<StorableCommand> {
  private static instance: CommandRegistry;
  protected readonly registryName = "Command";

  protected constructor() {
    super();
  }

  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  protected validate(item: StorableCommand): void {
    const zodItem = AnyCommandSchema.safeParse(item);
    if (!zodItem.success) {
      throw new Error(`Zod validation failed: ${zodItem.error.message}`);
    }
    const nameValidator = new NameValidator<StorableCommand>();
    const runFunctionValidator = new RunFunctionValidator<StorableCommand>();
    nameValidator.setNext(runFunctionValidator);
    nameValidator.validate(item);
    super.validate(item);
  }

  protected postRegister(item: StorableCommand): void {
    if (item.type === ApplicationCommandType.ChatInput && "options" in item && item.options) {
      const handlers = new Map<string, AutocompleteHandler<any>>();
      findAutocompleteHandlers(item.options as CommandOption<any>[], handlers);
      if (handlers.size > 0) {
        autocompleteRegistry.set(item.name, handlers);
      }
    }
    super.postRegister(item);
  }
}

export const commandRegistry = CommandRegistry.getInstance();

export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: ChatInputCommand<TName, TContexts>): void;
export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: UserContextMenuCommand<TName, TContexts>): void;
export function createCommand<
  const TName extends string,
  const TContexts extends readonly InteractionContextType[] | undefined,
>(options: MessageContextMenuCommand<TName, TContexts>): void;
export function createCommand(options: AnyCommand): void {
  const commandToRegister: StorableCommand = {
    ...options,
    run: (interaction: AnyCommandInteraction) => {
      const originalRun = options.run as (interaction: any) => any;
      return originalRun(interaction);
    },
  };
  commandRegistry.register(commandToRegister);
}

export async function registerApplicationCommands(
  client: Client,
  guilds?: readonly string[],
): Promise<void> {
  const facade = new DiscordApiFacade(env.BOT_TOKEN);
  await facade.registerApplicationCommands(
    client,
    commandRegistry.store as Map<string, AnyCommand>,
    guilds,
  );
}
