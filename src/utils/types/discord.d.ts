import { Collection, type Locale } from "discord.js";
import type { StorableCommand } from "#discord/modules";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, StorableCommand>;
    cooldowns: Collection<string, Collection<string, number>>;
  }

  export interface Message {
    readonly locale: Locale;
  }

  export interface BaseInteraction {
    locale: Locale;
  }
}
