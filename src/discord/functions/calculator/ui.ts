import { createEmbed, createRow, createButton } from "#discord/builders";
import type { CalculatorStateData } from "#states";
import { colors } from "#utils";
import { ButtonStyle, codeBlock } from "discord.js";

export function buildCalculatorUI(stateId: string, state: CalculatorStateData) {
  const embed = createEmbed({
    color: colors.blurple.hex,
    fields: [
      {
        name: "🧮  Calc",
        value: codeBlock(`\n${state.expression || " "}\n\n${state.display || "0"}`),
        inline: true,
      },
    ],
  });

  const components = [
    createRow(
      createButton({
        customId: `calc/press/${stateId}/clear`,
        label: "C",
        style: ButtonStyle.Danger,
      }),
      createButton({ customId: `calc/press/${stateId}/(`, label: "(", style: ButtonStyle.Primary }),
      createButton({ customId: `calc/press/${stateId}/)`, label: ")", style: ButtonStyle.Primary }),
      createButton({
        customId: `calc/press/${stateId}/divide`,
        label: "÷",
        style: ButtonStyle.Primary,
      }),
    ),
    createRow(
      createButton({
        customId: `calc/press/${stateId}/7`,
        label: "7",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/8`,
        label: "8",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/9`,
        label: "9",
        style: ButtonStyle.Secondary,
      }),
      createButton({ customId: `calc/press/${stateId}/*`, label: "×", style: ButtonStyle.Primary }),
    ),
    createRow(
      createButton({
        customId: `calc/press/${stateId}/4`,
        label: "4",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/5`,
        label: "5",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/6`,
        label: "6",
        style: ButtonStyle.Secondary,
      }),
      createButton({ customId: `calc/press/${stateId}/-`, label: "–", style: ButtonStyle.Primary }),
    ),
    createRow(
      createButton({
        customId: `calc/press/${stateId}/1`,
        label: "1",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/2`,
        label: "2",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/3`,
        label: "3",
        style: ButtonStyle.Secondary,
      }),
      createButton({ customId: `calc/press/${stateId}/+`, label: "+", style: ButtonStyle.Primary }),
    ),
    createRow(
      createButton({
        customId: `calc/press/${stateId}/0`,
        label: "0",
        style: ButtonStyle.Secondary,
      }),
      createButton({
        customId: `calc/press/${stateId}/.`,
        label: ".",
        style: ButtonStyle.Secondary,
      }),
      createButton({ customId: `calc/press/${stateId}/=`, label: "=", style: ButtonStyle.Success }),
      createButton({
        customId: `calc/press/${stateId}/none`,
        emoji: "🧮",
        style: ButtonStyle.Secondary,
        disabled: true,
      }),
    ),
  ];

  return { embeds: [embed], components };
}
