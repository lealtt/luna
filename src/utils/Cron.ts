// Enum for the days of the week. Sunday is 0.
export enum WeekDay {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

// Defines the shape of the Cron helper object.
interface ICronHelper {
  seconds(s: number): string;
  minutes(m: number): string;
  hours(h: number): string;
  dailyAt(hour: number, minute?: number): string;
  weeklyAt(dayOfWeek: WeekDay, hour: number, minute?: number): string;
}

// Utility to create readable cron pattern strings.
export const Cron: ICronHelper = {
  // Runs a task every X seconds.
  seconds: function (s: number): string {
    return `*/${s} * * * * *`;
  },

  // Runs a task every X minutes.
  minutes: function (m: number): string {
    return `*/${m} * * * *`;
  },

  // Runs a task every X hours.
  hours: function (h: number): string {
    return `0 */${h} * * *`;
  },

  // Runs a task daily at a specific time.
  dailyAt: function (hour: number, minute: number = 0): string {
    return `${minute} ${hour} * * *`;
  },

  // Runs a task weekly on a specific day and time.
  weeklyAt: function (dayOfWeek: WeekDay, hour: number, minute: number = 0): string {
    return `${minute} ${hour} * * ${dayOfWeek}`;
  },
};
