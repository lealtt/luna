import { createComponent, ComponentInteractionType } from "#discord/modules";
import { calculatorState } from "#states";
import { t } from "#utils";
import { calculator } from "#discord/functions";

createComponent({
  customId: "calc/press/{stateId}/{key}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  async run(interaction, { stateId, key }) {
    await interaction.deferUpdate();

    const { locale, user } = interaction;

    const currentState = calculatorState.get(stateId);

    if (!currentState || currentState.userId !== user.id) {
      await interaction.followUp({
        content: t(locale, "common_errors.component_unauthorized"),
      });
      return;
    }

    const newState = calculator.processCalculatorKey(currentState, key);

    calculatorState.update(stateId, newState);
    calculatorState.touch(stateId);

    const ui = calculator.buildCalculatorUI(stateId, newState);
    await interaction.editReply(ui);
  },
});
