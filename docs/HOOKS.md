# 🎣 Bot Lifecycle Hooks

**Publish/Subscribe system** for decoupled modules. Emit events → Listen anywhere.

---

## 🎯 Quick Start

### Listen to a Hook

```typescript
import { onReady } from "#discord/hooks";

onReady(
  ({ client }) => {
    logger.success(`${client.user.tag} is ready!`);
  },
  { name: "my-listener" },
);
```

### Emit a Hook

```typescript
import { emitBotEvent } from "#discord/hooks";

await emitBotEvent("system:points:awarded", client, {
  user,
  points: 100,
});
```

---

## ✨ Core Events

| Phase        | Before                         | After                         |
| ------------ | ------------------------------ | ----------------------------- |
| **Init**     | `bot:before-init`              | `bot:after-init`              |
| **Database** | `bot:before-db-connect`        | `bot:after-db-connect`        |
| **Modules**  | `bot:before-modules-load`      | `bot:after-modules-load`      |
| **Commands** | `bot:before-commands-register` | `bot:after-commands-register` |
| **Login**    | `bot:before-login`             | `bot:after-login`             |
| **Ready**    | -                              | `bot:client-ready`            |
| **Tasks**    | `bot:before-tasks-start`       | `bot:after-tasks-start`       |
| **Shutdown** | `bot:before-shutdown`          | `bot:after-shutdown`          |

**Critical:** `bot:critical-error`

---

## 🚀 Module Events

| Type                | Before                        | After          | Error   |
| ------------------- | ----------------------------- | -------------- | ------- |
| **Slash Commands**  | `command:beforeExecute`       | `afterExecute` | `error` |
| **Prefix Commands** | `prefixCommand:beforeExecute` | `afterExecute` | `error` |
| **Components**      | `component:beforeExecute`     | `afterExecute` | `error` |
| **Tasks**           | `task:beforeRun`              | `afterRun`     | `error` |

**Custom:** `interaction:created` • `message:created` • `paginator:button:beforeExecute`

---

## 🆚 Hooks vs Middleware

| **Hooks**              | **Middleware**            |
| ---------------------- | ------------------------- |
| **Parallel** execution | **Sequential** chain      |
| **Fire & forget**      | Can **block** command     |
| **React** to events    | **Check before** run      |
| **Logging/Analytics**  | **Permissions/Cooldowns** |

---

**Use Hooks for:** Logging • Analytics • Decoupled modules
**Use Middleware for:** Permissions • Validation
