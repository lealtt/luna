# 📖 Interactive `/help` Command

**Beautiful paginator** with category dropdown. No more wall of text!

**Demo:** [Buttons + Menu] → Navigate • Filter • Clean embeds

---

## 🎯 Quick Start

```typescript
import { createCommand, createPaginator } from "#discord/modules";

createCommand({
  name: "help",
  async run(interaction) {
    await interaction.reply({
      ephemeral: true,
      ...createPaginator({
        paginatorId: "help",
        items: utilityCommands,
        itemsPerPage: 3,
        user: interaction.user,
        formatPage,
        style: "both", // ✅ Buttons + Dropdown
        menuItems, // Categories
        timeout: 2 * 60 * 1000, // 2 min
      }),
    });
  },
});
```

---

## ✨ Setup (3 Steps)

| Step          | Code                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| **1. Data**   | `const utilityCommands = [{ name: "/ping", description: "..." }]`         |
| **2. Menu**   | `menuItems: [{ label: "Utility", emoji: "🛠️", value: "utility", items }]` |
| **3. Format** | `formatPage(items) → EmbedBuilder`                                        |

---

## 🚀 Full Config

| Option              | Value               | Purpose           |
| ------------------- | ------------------- | ----------------- |
| `style: "both"`     | Buttons + Dropdown  | ✅ **Full UX**    |
| `menuItems`         | Array of categories | Filter commands   |
| `itemsPerPage: 3`   | Commands per page   | Clean layout      |
| `timeout: 2min`     | Auto-disable        | Save resources    |
| `showPageIndicator` | `true`              | "Page 1/5" button |

---

**Result:** **Interactive** • **Categorized** • **Professional**  
**~15 lines total** | **No manual button handling!**
