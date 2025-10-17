<div align="center">
  <br />
  <h1>🌙 Luna</h1>
  <p>
    <strong>A modern Discord bot framework</strong><br />
    Built with TypeScript & discord.js • Scalable • Maintainable • Production-ready
  </p>
  <br />

  <img src="https://img.shields.io/badge/discord.js-v14-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js v14">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript 5.x">
  <img src="https://img.shields.io/github/license/lealtt/luna?style=for-the-badge" alt="MIT License">
</div>

---

## 🚀 Quick Start

### Prerequisites

- Node.js **v18+**
- [pnpm](https://pnpm.io/)
- [Discord Bot Token](https://discord.com/developers/applications)

### Setup

```bash
git clone https://github.com/lealtt/luna.git
cd luna
pnpm install
```

**Create `.env`:**

```env
BOT_TOKEN=your_token_here
MONGO_URI=your_mongo_uri
```

**Run:**

```bash
pnpm dev    # Development
pnpm start  # Production
```

---

## ✨ Core Features

| Feature                 | Description                                |
| ----------------------- | ------------------------------------------ |
| **🧠 TypeScript-first** | Full type safety                           |
| **⚙️ Dynamic Loading**  | Auto-discovers commands, events, tasks     |
| **🌐 Unified i18n**     | Server-preferred language support          |
| **📜 Structured Logs**  | Colored logs + Discord channel integration |
| **🛡️ Middleware**       | Permissions, cooldowns for all commands    |
| **🧩 Components**       | Type-safe customId parsing                 |
| **⏱️ Tasks**            | Scheduled jobs & startup tasks             |
| **📑 Paginator**        | Interactive embeds from any data           |
| **🔒 State Handler**    | Zod-powered interaction states             |
| **🚩 Flag Parsing**     | Type-safe prefix command args              |

---

## 🛠️ CLI Commands

```bash
pnpm cli <command>
```

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `upload <files>` | Upload images/zip as emojis       |
| `list`           | List all app emojis (JSON)        |
| `delete [ids]`   | Delete emojis by ID               |
| `generate-json`  | Create `emojis.json` from Discord |
| `help`           | Show CLI help                     |

---

## 🤝 Contributing

1. Fork & clone
2. `pnpm install`
3. Follow TypeScript best practices
4. Submit PR

---

## 📄 License

[MIT](https://github.com/lealtt/luna/blob/main/LICENSE)
