<div align="center">
<br />
<h1>🌙 Luna</h1>
<p>
A modern, modular <strong>Discord bot framework</strong> built with TypeScript and discord.js.<br />
Designed for scalability, maintainability, and clean code. Perfect for building production-grade bots quickly.
</p>
<br />

<img src="https://img.shields.io/badge/discord.js-v14-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js v14">
<img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5.x">
<img src="https://img.shields.io/github/license/lealtt/luna?style=for-the-badge" alt="MIT License">
</div>

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- [pnpm](https://pnpm.io/) (or your preferred package manager)
- A [Discord Application](https://discord.com/developers/applications) with a bot token

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
BOT_PREFIX="!,?,.,-"
CLIENT_ID=""
MONGO_URI=YOUR_MONGODB_URI_HERE
LOG_CHANNEL_ID=YOUR_LOG_CHANNEL_ID_HERE
```

</details>

---

### ⚡ Running the Bot

#### Development Mode

```bash
pnpm dev
```

#### Production Mode

```bash
# 1. Build the project
pnpm build

# 2. Start the bot
pnpm start
```

---

## ✨ Features

| Feature                              | Description                                                                                                                       |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| 🧠 **TypeScript-first**              | Full type safety across commands, events, components, and a localization system that auto-generates types from translation files. |
| ⚙️ **Dynamic Module Loading**        | Automatically loads all commands, events, and tasks from your source tree without manual imports.                                 |
| 🌐 **Unified i18n System**           | Prioritizes server language preferences for consistent localization across all command and component types.                       |
| 📜 **Structured Logging System**     | Colored and categorized logs with middleware support to log command usage to a Discord channel.                                   |
| ⚡ **Fast Startup**                  | Optimized for quick boot times via parallel module loading.                                                                       |
| 🛡️ **Middleware System**             | Reusable checks (permissions, cooldowns, etc.) that run before command execution for both prefix and interaction commands.        |
| 🧩 **Component-driven Architecture** | Safely pass values and context through dynamic `customId`s with automatic parameter extraction.                                   |
| 🛠️ **Utility Factories**             | Create ActionRows, Embeds, Buttons, and Select Menus consistently with helper functions.                                          |
| ⏱️ **Scheduled Task System**         | Run scheduled tasks automatically at intervals or on startup.                                                                     |
| 📑 **Reusable Paginator**            | Build interactive, stateful paginated embeds from any dataset with minimal setup.                                                 |
| 🔒 **Interaction State Handler**     | Type-safe in-memory state management powered by Zod.                                                                              |
| 💬 **Multi-Command Type Support**    | Unified handling for Slash, Prefix, and Context Menu (User & Message) commands.                                                   |
| 🚩 **Flag Parsing with Zod**         | Validate and parse named arguments for prefix commands with full type safety.                                                     |
| ⏳ **Integrated Cooldown System**    | Built-in cooldowns for both prefix and interaction commands with localized feedback.                                              |

---

## 🛠️ Command-Line Interface (CLI)

Luna includes a powerful command-line interface to help manage your bot's application emojis directly from your terminal.

### Usage

```bash
pnpm cli <command> [arguments]
```

### Available Commands

| Command         | Arguments           | Description                                                                                      |
| :-------------- | :------------------ | :----------------------------------------------------------------------------------------------- |
| `upload`        | `<path/to/file...>` | Uploads images or `.zip` archives as new emojis. Converts `snake_case` filenames to `camelCase`. |
| `list`          |                     | Lists all current application emojis in a machine-readable JSON array.                           |
| `delete`        | `[emoji_id...]`     | Deletes specific emojis by ID, or all emojis (with confirmation) if no IDs are given.            |
| `generate-json` |                     | Fetches live emoji data from Discord and creates an `emojis.json` file in the project root.      |
| `help`          |                     | Displays a detailed help message for all available CLI commands.                                 |

---

## 🤝 Contributing

Contributions and feature suggestions are welcome!
Please follow TypeScript best practices and ensure all code passes linting before submission.

---

## 📄 License

This project is licensed under the **MIT License**.
See the [LICENSE](https://github.com/lealtt/luna/blob/main/LICENSE) file for details.

---
