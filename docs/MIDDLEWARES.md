# 🛡️ Command Middlewares

**Checkpoints** that run _before_ commands. Validate • Check permissions • Rate limit.

**Flow:** Trigger → Middleware Chain → Command (or **BLOCKED**)

---

## 🎯 Quick Start

### Admin-Only Command

```typescript
import { createPrefixCommand } from "#discord/modules";
import { checkPermissions } from "#discord/middlewares";
import { PermissionFlagsBits } from "discord.js";

createPrefixCommand({
  name: "kick",
  middlewares: [checkPermissions(PermissionFlagsBits.KickMembers)],
  async run(message) {
    // Only runs if user has KickMembers permission
    const member = message.mentions.members.first();
    await member?.kick();
    await message.reply("✅ Kicked!");
  },
});
```

---

## ✨ Built-in Middlewares

| Middleware               | Purpose                    | Auto-applied?       |
| ------------------------ | -------------------------- | ------------------- |
| `rateLimitMiddleware`    | Prevent spam               | ✅ **All commands** |
| `checkPermissions(perm)` | Require Discord permission | ❌ Manual           |

---

## 🔄 How It Works

| Step       | Action               | Result                                  |
| ---------- | -------------------- | --------------------------------------- |
| 1. Trigger | User runs `/kick`    | -                                       |
| 2. Check   | `checkPermissions()` | **PASS** → Next<br>**FAIL** → **BLOCK** |
| 3. Execute | Command `run()`      | ✅ Success                              |

**Key:** Call `next()` to pass • **Don't call** = Block

---

**Use for:** Permissions • Cooldowns • Validation  
**Don't use for:** Logging • Analytics _(use Hooks)_
