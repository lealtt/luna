import type { Client } from "discord.js";

type TaskSchedule = { interval: number; cron?: never } | { cron: string; interval?: never };

export type Task = {
  name: string;
  runImmediately?: boolean;
  run: (client: Client) => any | Promise<any>;
} & TaskSchedule;
