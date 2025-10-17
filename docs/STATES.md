# 🔒 State System

**In-memory cache** for interaction context. Type-safe • Auto-cleanup • No database.

**Use:** Store data between `/command` → Button click (10s → 1h TTL)

---

## 🎯 Quick Start

### 1. Create Manager

```typescript
// src/discord/states/like.state.ts
import { StateManager } from "#discord/structures";

export const likeState = new StateManager<{ authorId: string; targetId: string }>({
  name: "LikeState",
  maxSize: 1000,
  defaultTTL: 10 * 60 * 1000, // 10 min
});
```

### 2. Store in Command

```typescript
createCommand({
  name: "like",
  run(interaction) {
    const stateId = likeState.set({
      authorId: interaction.user.id,
      targetId: interaction.options.getUser("user")!.id,
    });

    interaction.reply({
      content: "❤️ Like this user?",
      components: [
        createRow(
          createButton({
            customId: `like/${stateId}`,
            label: "Like",
          }),
        ),
      ],
    });
  },
});
```

### 3. Retrieve in Button

```typescript
createComponent({
  customId: "like/{stateId}",
  run(interaction, { stateId }) {
    const state = likeState.get(stateId);
    if (!state) return interaction.reply({ content: "❌ Expired!" });

    // Use state data...
    likeState.delete(stateId); // Cleanup
  },
});
```

---

## ✨ Config

| Option            | Default | Purpose            |
| ----------------- | ------- | ------------------ |
| `maxSize`         | 10,000  | Max entries        |
| `defaultTTL`      | 1 hour  | Auto-expire        |
| `cleanupInterval` | 5 min   | Garbage collection |

---

## 🔄 Lifecycle

| Step  | Action                | Auto?           |
| ----- | --------------------- | --------------- |
| **1** | `set()` → Store + ID  | ✅              |
| **2** | `get(id)` → Retrieve  | ✅ Expire check |
| **3** | `delete(id)` → Remove | Manual          |
| **4** | Cleanup expired       | ✅ Every 5min   |

---

## ⚠️ Best Practices

| ✅ **DO**            | ❌ **DON'T**        |
| -------------------- | ------------------- |
| `if (!state) return` | Assume state exists |
| `delete()` after use | Forget cleanup      |
| TTL = 10min max      | 24h TTLs            |
| `maxSize: 1000`      | Unlimited           |

**⚠️ Lost on restart** → Use DB for permanent data
