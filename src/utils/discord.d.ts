import { Command } from "#discord/registry";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
    cooldowns: Collection<string, Collection<string, number>>;
  }
}
