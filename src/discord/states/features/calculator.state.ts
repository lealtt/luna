import { StateManager } from "#discord/structures";
import { Timer } from "#utils";

export type CalculatorStateData = {
  display: string;
  expression: string;
  overwrite: boolean;
  userId: string;
};

export const calculatorState = new StateManager<CalculatorStateData>({
  name: "Calculator",
  maxSize: 1000,
  defaultTTL: Timer(15).min(),
});
