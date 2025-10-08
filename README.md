<div align="center">
  <br />
  <h1>🌙 Luna</h1>
  <p>
    A modern, modular <strong>Discord bot framework</strong> built with TypeScript and discord.js.<br />
    Designed for scalability, maintainability, and clean code perfect for building production-grade bots quickly.
  </p>
  <br />

  <img src="https://img.shields.io/badge/discord.js-v14-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js v14">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5.x">
  <img src="https://img.shields.io/github/license/lealtt/luna?style=for-the-badge" alt="MIT License">
</div>

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- [pnpm](https://pnpm.io/) (or your preferred package manager)
- A [Discord Application](https://discord.com/developers/applications) with a bot token.

---

### ⚙️ Installation & Setup

<details>
<summary><strong>1. Clone the repository</strong></summary>

```bash
# Clone the repository to your local machine
git clone https://github.com/lealtt/luna.git
cd luna
```

</details>

<details>
<summary><strong>2. Install dependencies</strong></summary>

```bash
# Using pnpm (recommended)
pnpm install
```

</details>

<details>
<summary><strong>3. Configure environment variables</strong></summary>

Create a `.env` file in the root of the project and add your bot's token and other required variables:

```env
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
MONGO_URI=YOUR_MONGODB_URI_HERE
LOG_CHANNEL_ID=YOUR_LOG_CHANNEL_ID_HERE
```

</details>

---

### ⚡ Running the Bot

- **Development Mode** (with hot-reloading):

```bash
pnpm dev
```

- **Production Mode**:

```bash
# 1. Build the project
pnpm build

# 2. Start the bot
pnpm start
```

---

## ✨ Features

- 🧠 **TypeScript-first** – Full type safety across commands, events, components, and localization.
- ⚙️ **Dynamic Module Loading** – Automatically loads all modules from your source tree.
- 🌐 **i18n System** – Type-safe internationalization with automatic key generation.
- 📜 **Logging System** – Structured and colored console logs with custom levels.
- ⚡ **Fast Startup** – Optimized runtime imports and parallel module loading.
- 🧩 **Component-driven** – Easily pass values and context through custom IDs.
- 🛠️ **Utility Functions** – Helpers for creating ActionRows, Embeds, Buttons, and more.
- ⏱️ **Task System** – Schedule tasks to run automatically at specified intervals.
- 📑 **Reusable Paginator** – A powerful utility for creating paginated embeds.
- 🔒 **Interaction State Handler** – Type-safe, in-memory system using Zod for temporary data.
- 🛡️ **Middleware System** – Create reusable checks that run before command logic.

---

## 🤝 Contributing

Pull requests and feature suggestions are welcome! Please follow TypeScript best practices and ensure all code passes linting before submission.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](https://github.com/lealtt/luna/blob/main/LICENSE) file for details.
