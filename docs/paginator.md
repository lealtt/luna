## Interactive Help Command with a Paginator

This code creates a user-friendly `/help` command for a Discord bot. Instead of showing a long, static list, it uses an interactive paginator that allows users to navigate through pages with buttons and filter commands by category using a dropdown menu.

---

### How It Works

The implementation is broken down into a few logical steps:

#### 1\. Define the Data

First, we prepare the data to be displayed. For this example, we have two separate arrays of command objects, each representing a different category.

```javascript
// Utility Commands
interface MockCommand {
  name: string;
  description: string;
}

const utilityCommands: MockCommand[] = [
  { name: "/help", description: "Shows this help message." },
  { name: "/ping", description: "Checks the bot's latency." },
  // ... more commands
];

// Fun Commands
const funCommands: MockCommand[] = [
  { name: "/calculator", description: "Opens an interactive calculator." },
  { name: "/avatar", description: "Shows a user's avatar." },
  // ... more commands
];
```

---

#### 2\. Create the Menu Items

Next, we define the options that will appear in the dropdown menu. Each menu item is an object containing a `label`, `emoji`, a unique `value` (ID), and most importantly, the `items` property which links the menu option to the corresponding data array from Step 1.

```javascript
const menuItems: PaginatorMenuItem<MockCommand>[] = [
  {
    label: "Utility Commands",
    emoji: "🛠️",
    value: "utility",
    items: utilityCommands,
  },
  {
    label: "Fun Commands",
    emoji: "🎉",
    value: "fun",
    items: funCommands,
  },
];
```

---

#### 3\. Format the Page Display

We create a function called `formatPage` that is responsible for the visual presentation of each page. It receives the items for the current page and returns a Discord `EmbedBuilder` with a clean, formatted list.

```javascript
const formatPage = (pageItems, currentPage, totalPages) => {
  const description = pageItems.map((cmd) => `**${cmd.name}**: ${cmd.description}`).join("\n");

  return createEmbed({
    description,
    title: "Help Panel"
    color: "Blue",
    footer: {
      text: `Page: ${currentPage} of ${totalPages}`
    }
  })
};
```

---

#### 4\. Build the Slash Command and Paginator

Finally, we put everything together inside a slash command. When the command is executed, it calls the `createPaginator` function with all our configurations.

The `createPaginator` options include:

- **`items`**: The initial list of commands to display.
- **`itemsPerPage`**: How many commands to show on a single page.
- **`user`**: The user who is allowed to interact with the buttons and menu.
- **`formatPage`**: The function we created in Step 3.
- **`style: 'both'`**: A key option that enables both navigation buttons and the dropdown menu.
- **`menuItems`**: The menu configuration from Step 2.
- **`emojis`**: An object to **customize the emojis** for the navigation buttons (e.g., `first`, `previous`, `next`).
- **`timeout`**: A timer to disable the components after a period of inactivity.

The `createPaginator` function returns an object with `embeds` and `components`, which is then used to reply to the interaction.

---

### Final Code

```javascript
createCommand({
  name: "help",
  description: "Displays an interactive help panel with all commands.",
  // ...
  async run(interaction) {
    const paginatorOptions = createPaginator({
      paginatorId: "help-paginator",
      items: utilityCommands,
      itemsPerPage: 3,
      user: interaction.user,
      formatPage,

      // --- Features ---
      style: "both",
      menuItems: menuItems,
      menuPlaceholder: "Select a category...",
      timeout: Timer(2).min(),
      showPageIndicator: true,
      // You can optionally define custom emojis here
      // emojis: { previous: "◀️", next: "▶️" }
    });

    await interaction.reply({ flags: "Ephemeral", ...paginatorOptions });
  },
});
```

This results in a clean, professional, and easy-to-navigate help command for your users.
