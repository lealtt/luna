# 📍 State System (Temporary Interaction Storage)

Luna's **state system**, now powered by the `StateManager` class, provides a robust and efficient way to store **temporary, type-safe data** between Discord interactions (for example, between a `/command` execution and a button click).

It's the ideal solution when you need to **maintain context** for an interaction without using a database, with the advantage of being an in-memory cache with automatic resource management.

---

## ⚙️ How It Works

The system is built on the `StateManager` class, which provides an in-memory cache with a time-to-live (TTL), size limit, and automatic cleanup.

```ts
import { StateManager } from "#discord/structures";
```

### `new StateManager<T>(options)`

To create a new state manager, you instantiate the `StateManager` class, specifying the type `T` of the data to be stored and passing an options object.

**Constructor Options:**

| Option            | Description                                                                       | Default         |
| ----------------- | --------------------------------------------------------------------------------- | --------------- |
| `name`            | A unique name for the manager, used in logs.                                      | **Required**    |
| `maxSize`         | The maximum number of entries the cache can hold before evicting the oldest ones. | `10000`         |
| `defaultTTL`      | The default time-to-live for each entry, in milliseconds.                         | `3600000` (1h)  |
| `cleanupInterval` | How often the automatic cleanup of expired entries is performed.                  | `300000` (5min) |

**Main Methods:**

| Method             | Description                                                                             |
| ------------------ | --------------------------------------------------------------------------------------- |
| `set(data, ttl?)`  | Stores `data` and returns a unique `stateId`. The optional `ttl` overrides the default. |
| `get(stateId)`     | Retrieves the data. Returns `undefined` if the entry does not exist or has expired.     |
| `update(id, data)` | Partially updates the data of an existing entry without resetting its TTL.              |
| `delete(stateId)`  | Removes an entry from the cache.                                                        |
| `has(stateId)`     | Checks if an entry exists and is not expired.                                           |
| `getStats()`       | Returns detailed statistics about the cache usage (size, hit rate, evictions, etc.).    |

---

## 🧩 Internal Mechanics

- States are stored in an in-memory `Map`.
- A `setInterval` periodically performs cleanup of expired entries, which is more efficient than a `setTimeout` per entry.
- When `maxSize` is reached, the least recently used entries (LRU policy) are removed to make room for new ones, preventing excessive memory consumption.
- The generated IDs are unique and are no longer tied to the manager's name.

> ⚠️ Since this system uses in-memory storage, **all states are lost when the bot restarts**.

---

## ✅ Example: The New `/like` Command

Here’s the complete and updated example for the `/like` command.

### 1\. Defining the State

Instead of `defineState`, we now create an instance of `StateManager`.

**File:** `src/discord/states/like.state.ts`

```ts
import { StateManager } from "#discord/structures";
import { Timer } from "#utils";

// Define the data type that this manager will store
type LikeStateData = {
  authorId: string;
  targetId: string;
};

// Create and export the state manager instance
export const likeState = new StateManager<LikeStateData>({
  name: "LikeState",
  maxSize: 1000,
  defaultTTL: Timer(10).min(), // 10 minute TTL
});
```

### 2\. Creating the `/like` Command

The command's code remains almost the same, as the `.set()` method is still used in the same way.

**File:** `src/discord/commands/slash/utility/like.ts`

```ts
import { createButton, createRow } from "#discord/builders";
import { createCommand } from "#discord/modules";
import { likeState } from "#states";
// ... other imports

createCommand({
  name: "like",
  // ...
  run(interaction) {
    const { user: author, options } = interaction;
    const targetUser = options.getUser("user", true);

    // Store the data and get a unique ID
    const stateId = likeState.set({
      authorId: author.id,
      targetId: targetUser.id,
    });

    const row = createRow(
      createButton({
        customId: `like/${stateId}`, // The ID is used in the button
        labelI18nKey: "like.button_label",
        emoji: "❤️",
        style: ButtonStyle.Success,
      }),
    );

    interaction.reply({
      content: t(interaction.locale, "like.reply_content", { author, target: targetUser }),
      components: [row],
    });
  },
});
```

### 3\. Handling the Button Interaction

The component that handles the button click also remains almost unchanged.

**File:** `src/discord/components/buttons/like.ts`

```ts
import { createComponent, ComponentInteractionType } from "#discord/modules";
import { likeState } from "#states";
// ... other imports

createComponent({
  customId: "like/{stateId}",
  type: ComponentInteractionType.Button,
  cached: "cached",
  async run(interaction, { stateId }) {
    // Retrieve the data using the ID
    const state = likeState.get(stateId);

    // If the state has expired or doesn't exist, `get` returns `undefined`
    if (!state) {
      return interaction.reply({
        content: t(interaction.locale, "like_component.like_expired"),
        flags: MessageFlags.Ephemeral,
      });
    }

    const { targetId } = state;
    const clicker = interaction.user;

    if (clicker.id === targetId) {
      // ...
    }

    await interaction.reply({
      content: t(interaction.locale, "like_component.like_success", {
        user: userMention(targetId),
      }),
      flags: MessageFlags.Ephemeral,
    });

    // Delete the state from memory after use
    likeState.delete(stateId);
  },
});
```

---

## 🧹 State Lifecycle Summary

1.  **Command runs:**
    → `state.set()` creates a cache entry with a TTL and returns a unique `stateId`.

2.  **User interacts with a component:**
    → `state.get()` retrieves the data. If the entry has expired, it returns `undefined`.

3.  **Automatic Cleanup:**
    → Periodically, the `StateManager` removes all expired entries. If the cache is full, it evicts the least used entries.

---

## ⚠️ Best Practices

- **Configure `maxSize` and `defaultTTL` sensibly:** Adjust the values to the use case to balance functionality and memory usage.
- **Always check the return value of `get()`:** Always assume that the state may no longer exist (`undefined`).
- **Use `delete()` when appropriate:** If a state can only be used once (like in the `like` example), manually remove it with `.delete()` to free up memory faster.
- **Use a database** for data that needs to persist between bot restarts.
