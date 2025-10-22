import {
  InteractionContextType,
  MessageFlags,
  type AutocompleteInteraction,
  type CacheType,
} from "discord.js";
import { autocompleteRegistry, commandRegistry } from "./command.module.js";
import { runMiddlewareChain } from "../shared/middleware.module.js";
import { logger } from "#utils";
import type { AnyApplicationCommandInteraction } from "./command.types.js";
import { t } from "#translate";

type AnyAutocompleteHandler = (
  interaction: AutocompleteInteraction<CacheType>,
) => Promise<void> | void;

export async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const command = commandRegistry.get(interaction.commandName);
  if (!command) return;

  const commandHandlers = autocompleteRegistry.get(interaction.commandName);
  if (!commandHandlers) return;

  const focusedOption = interaction.options.getFocused(true);
  const handler = commandHandlers.get(focusedOption.name) as AnyAutocompleteHandler | undefined;

  if (!handler) {
    logger.warn(
      `No autocomplete handler found for option "${focusedOption.name}" in command "${interaction.commandName}"`,
    );
    return;
  }

  try {
    const commandWithContexts = command as { contexts?: readonly InteractionContextType[] };
    const isGuildOnly =
      commandWithContexts.contexts?.length === 1 &&
      commandWithContexts.contexts[0] === InteractionContextType.Guild;

    await handler(isGuildOnly ? (interaction as AutocompleteInteraction<"cached">) : interaction);
  } catch (error) {
    logger.error(
      `Autocomplete error for "${interaction.commandName}:${focusedOption.name}":`,
      error,
    );
  }
}

export async function handleApplicationCommand(
  interaction: AnyApplicationCommandInteraction,
): Promise<void> {
  const client = interaction.client;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.error(`Command "${interaction.commandName}" not found.`);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: t("common_errors.generic"),
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: t("common_errors.generic"),
        flags: MessageFlags.Ephemeral,
      });
    }
    return;
  }

  try {
    const middlewares = [...(command.middlewares ?? [])];
    const executeCommand = () => command.run(interaction);

    await runMiddlewareChain(interaction, middlewares, executeCommand);
  } catch (error) {
    logger.error(`Error executing command "${command.name}":`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: t("common_errors.generic"),
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: t("common_errors.generic"),
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
