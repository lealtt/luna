# 🌙 Luna

**Luna** is a modern, modular **Discord bot base** built with [TypeScript](https://www.typescriptlang.org/) and [discord.js](https://discord.js.org/).  
It’s designed for scalability, maintainability, and clean code, perfect for building production-grade bots quickly.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/)
- A [Discord Application](https://discord.com/developers/applications) with a bot token

### Installation

```bash
# Clone the repository
git clone https://github.com/lealtt/luna.git
cd luna

# Install dependencies
pnpm install
```

### Development

```bash
# Run in development mode
pnpm dev
```

### Production

```bash
# Build and run
pnpm build
pnpm start
```

---

## ✨ Features

- 🧠 **TypeScript-first** – Full type safety across commands, events, components, and localization.
- ⚙️ **Dynamic Module Loading** – Automatically loads commands, events, components, and tasks from your source tree.
- 🌐 **i18n System** – Type-safe internationalization with automatic key generation and localization helpers.
- 📜 **Logging System** – Structured and colored console logs with custom levels.
- ⚡ **Fast Startup** – Parallel module loading and optimized runtime imports.
- 🧩 **Components with Custom IDs** – Pass values via components (buttons, selects, etc.) and retrieve them later.
- 🛠️ **Utility Functions** – Helper functions to easily create ActionRows, Embeds, Buttons, and other components.
- ⏱️ **Task System** – Schedule tasks to run automatically after a certain period of time or immediately when the bot starts.
- 📑 **Reusable Paginator** – A powerful creator function to easily build complex, customizable, and emoji-driven paginated embeds.
- 🔒 **Interaction State Handler** – A type-safe, in-memory system using Zod to securely pass temporary data between interactions, like from a command to a button.

---

## 💬 Contributing

Pull requests and issues are welcome!
Follow TypeScript best practices and ensure all code passes linting before submission.

---

## 📄 License

Licensed under the **MIT License**, see the [LICENSE](./LICENSE) file for details.
