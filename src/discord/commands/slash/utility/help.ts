import { createCommand, createEmbed } from "#discord/creators";
import { commandRegistry } from "#discord/registry";
import { colors, type I18nKey, t } from "#utils";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  MessageFlags,
} from "discord.js";

createCommand({
  name: "help",
  description: "Get information about a specific command.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  options: [
    {
      name: "command",
      description: "The command you want to know more about.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
  ],
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    const choices = Array.from(commandRegistry.values())
      .filter((cmd) => cmd.type === ApplicationCommandType.ChatInput)
      .map((cmd) => cmd.name);

    const filteredChoices = choices.filter((choice) =>
      choice.toLowerCase().startsWith(focusedValue.toLowerCase()),
    );

    await interaction.respond(
      filteredChoices.slice(0, 25).map((choice) => ({
        name: choice,
        value: choice,
      })),
    );
  },
  run(interaction) {
    const { locale, options } = interaction;
    const commandName = options.getString("command", true);
    const command = commandRegistry.get(commandName);

    if (!command || command.type !== ApplicationCommandType.ChatInput) {
      interaction.reply({
        content: t(locale, "help.command_not_found"),
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const descriptionKey = `commands.${command.name}.description` as I18nKey;

    const embed = createEmbed({
      title: t(locale, "help.embed_title", { commandName: command.name }),
      description: t(locale, descriptionKey),
      color: colors.blurple,
      fields: [
        {
          name: t(locale, "help.cooldown_field"),
          value: t(locale, "help.cooldown_value", {
            seconds: command.cooldown || 3,
          }),
        },
      ],
    });

    interaction.reply({
      embeds: [embed],
      flags: [MessageFlags.Ephemeral],
    });
  },
});
