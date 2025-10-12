# 📍 State System (Temporary Interaction Storage)

The **state system** provides a way to store **temporary, type-safe data** between Discord interactions, for example, between a `/command` and a button click.

It’s useful when you need to **keep context** without using a database, while ensuring data is **validated** using [`Zod`](https://zod.dev).

---

## ⚙️ How It Works

The main function is:

```ts
import { defineState } from "#utils";
```

### `defineState(name, schema)`

Creates a new state with:

- A **unique name** (used as a prefix for the state ID)
- A **Zod schema** that validates the stored data

It returns an object with three helper methods:

| Method                  | Description                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `set(data, ttl?)`       | Stores data temporarily and returns a unique `stateId`. The optional TTL (time-to-live) defaults to **15 minutes**. |
| `get(stateId)`          | Retrieves and validates the data. Returns `null` if it’s expired, invalid, or not part of this state type.          |
| `update(stateId, data)` | Updates stored data without resetting its TTL. Returns `true` if successful.                                        |

---

## 🧩 Internal Mechanics

Under the hood:

- States are stored in an in-memory `Map` (`stateCache`) with `{ stateId → data }` pairs.
- Each `stateId` follows the format:

  ```
  {name}:{UUID}
  ```

  Example:

  ```
  like:3c5e7e6a-0d77-4e2a-9a5a-5c123b05f1c3
  ```

- After the TTL expires, the data is automatically removed from memory.

> ⚠️ Since this system uses in-memory storage, **states are lost when the bot restarts**.

---

## ✅ Example: Like Command State

Here’s a complete example using a `/like` command that lets users “like” another member.

### 1. Defining the State

```ts
import { defineState } from "#utils";
import { z } from "zod";

/**
 * State for the /like command.
 */
export const likeState = defineState(
  "like",
  z.object({
    authorId: z.string(),
    targetId: z.string(),
  }),
);
```

This defines a state named `like` with two required string fields: `authorId` and `targetId`.

---

### 2. Creating the `/like` Command

```ts
import { createButton, createRow } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { likeState } from "#states";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionContextType,
  ButtonStyle,
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
    const { user: author, options } = interaction;
    const targetUser = options.getUser("user", true);

    // Store author and target IDs in a temporary state
    const stateId = likeState.set({
      authorId: author.id,
      targetId: targetUser.id,
    });

    // Create a button with the stateId embedded
    const row = createRow(
      createButton({
        customId: `like/${stateId}`,
        label: "Like",
        emoji: "❤️",
        style: ButtonStyle.Success,
      }),
    );

    // Send the message with the button
    interaction.reply({
      content: `${author.username} wants to show appreciation for ${targetUser.username}!`,
      components: [row],
    });
  },
});
```

🧠 Here:

- `likeState.set(...)` saves `{ authorId, targetId }` temporarily.
- The button’s `customId` includes the unique `stateId`:

  ```
  like/like:3c5e7e6a-0d77-4e2a-9a5a-5c123b05f1c3
  ```

---

### 3. Handling the Button Interaction

```ts
import { createComponent, ComponentInteractionType } from "#discord/modules";
import { likeState } from "#states";
import { MessageFlags, userMention } from "discord.js";

createComponent({
  customId: "like/{stateId}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  async run(interaction, { stateId }) {
    const state = likeState.get(stateId);

    // If the state expired or doesn’t exist
    if (!state) {
      return interaction.reply({
        content: "This like button has expired. Please use the command again.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const { targetId } = state;
    const clicker = interaction.user;

    // Prevent liking yourself
    if (clicker.id === targetId) {
      return interaction.reply({
        content: "You can’t like yourself!",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Send an ephemeral confirmation
    await interaction.reply({
      content: `You liked ${userMention(targetId)}! ❤️`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
```

💡 If the user clicks the button **after the state expires**,
`likeState.get(stateId)` returns `null`, and you can handle it gracefully.

---

## 🧹 State Lifecycle Summary

1. **Command runs:**
   → `set()` creates a temporary state and returns a unique `stateId`.

2. **User interacts with a component:**
   → `get()` retrieves and validates the stored data.

3. **TTL expires:**
   → The state is automatically deleted from memory.

---

## ⚠️ Best Practices

- Keep your TTLs short (e.g., 5–15 minutes).
- Always check if `get()` returns `null`.
- Avoid storing large or many states (they’re in memory).
- Use a database if you need persistence between restarts.

---

## 🧩 TL;DR Example

```ts
const userState = defineState("user", z.object({ id: z.string() }));

const id = userState.set({ id: "123" }); // create a temporary state
const data = userState.get(id); // → { id: "123" }
```
