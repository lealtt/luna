import { logger } from "#utils";

/**
 * How Monitoring Works:
 *
 * 1. Auto-Load: Files in `src/discord/monitoring/` (like `command.monitor.ts`) are loaded automatically by the bot's bootstrap process (`bootstrap.loader.ts`).
 * 2. Listeners: Each monitor file uses `onBotEvent` (`#discord/hooks`) to listen for specific events ('command:beforeExecute').
 * 3. Events: Core modules (commands, components, etc.) emit these events using `emitBotEvent`.
 *
 */

logger.success("Monitoring hooks registered successfully.");
