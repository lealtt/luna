import { createCommand } from "#discord/modules";
import { ApplicationCommandType, InteractionContextType, MessageFlags } from "discord.js";
import { calculatorState, type CalculatorStateData } from "#states";
import { calculator } from "#discord/functions";

createCommand({
  name: "calculator",
  description: "Opens an interactive calculator.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild, InteractionContextType.BotDM],
  run(interaction) {
    const initialState: CalculatorStateData = {
      display: "0",
      expression: "0",
      overwrite: true,
      userId: interaction.user.id,
    };

    const stateId = calculatorState.set(initialState);
    const ui = calculator.buildCalculatorUI(stateId, initialState);

    interaction.reply({
      ...ui,
      flags: MessageFlags.Ephemeral,
    });
  },
});
