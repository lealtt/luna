import { createButton, createRow } from "#discord/builders";
import { createCommand } from "#discord/creators";
import { likeState } from "#states";
import { t } from "#utils";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonStyle,
  InteractionContextType,
  userMention,
} from "discord.js";

createCommand({
  name: "like",
  description: "Show your appreciation for someone.",
  type: ApplicationCommandType.ChatInput,
  contexts: [InteractionContextType.Guild],
  options: [
    {
      name: "user",
      description: "The user you want to like.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
  ],
  run(interaction) {
    const { locale, user: author, options } = interaction;
    const targetUser = options.getUser("user", true);

    // Store the author's and target's IDs in the state.
    const stateId = likeState.set({
      authorId: author.id,
      targetId: targetUser.id,
    });

    const row = createRow(
      createButton({
        customId: `like/${stateId}`,
        label: t(locale, "like.button_label"),
        emoji: "❤️",
        style: ButtonStyle.Success,
      }),
    );

    // Send the message with the button.
    interaction.reply({
      content: t(locale, "like.reply_content", {
        author: userMention(author.id),
        target: userMention(targetUser.id),
      }),
      components: [row],
    });
  },
});
