import { describe, it } from "node:test";
import assert from "node:assert";
import { Cron, WeekDay } from "#utils";

describe("Cron Utility", () => {
  // Test the .seconds() method.
  it("should generate correct cron string for seconds", () => {
    assert.strictEqual(Cron.seconds(15), "*/15 * * * * *", "Every 15 seconds should match pattern");
    assert.strictEqual(Cron.seconds(1), "*/1 * * * * *", "Every 1 second should match pattern");
    assert.strictEqual(Cron.seconds(60), "*/60 * * * * *", "Every 60 seconds should match pattern"); // Although practically same as every minute
  });

  // Test the .minutes() method.
  it("should generate correct cron string for minutes", () => {
    assert.strictEqual(Cron.minutes(5), "*/5 * * * *", "Every 5 minutes should match pattern");
    assert.strictEqual(Cron.minutes(1), "*/1 * * * *", "Every 1 minute should match pattern");
    assert.strictEqual(Cron.minutes(30), "*/30 * * * *", "Every 30 minutes should match pattern");
  });

  // Test the .hours() method.
  it("should generate correct cron string for hours", () => {
    assert.strictEqual(Cron.hours(1), "0 */1 * * *", "Every 1 hour should match pattern");
    assert.strictEqual(Cron.hours(6), "0 */6 * * *", "Every 6 hours should match pattern");
    assert.strictEqual(Cron.hours(24), "0 */24 * * *", "Every 24 hours should match pattern"); // Although practically same as daily
  });

  // Test the .dailyAt() method with and without minutes.
  it("should generate correct cron string for daily execution", () => {
    assert.strictEqual(Cron.dailyAt(8), "0 8 * * *", "Daily at 8:00 should match pattern");
    assert.strictEqual(Cron.dailyAt(17, 30), "30 17 * * *", "Daily at 17:30 should match pattern");
    assert.strictEqual(
      Cron.dailyAt(0, 0),
      "0 0 * * *",
      "Daily at 00:00 (midnight) should match pattern",
    );
  });

  // Test the .weeklyAt() method using the WeekDay enum.
  it("should generate correct cron string for weekly execution", () => {
    assert.strictEqual(
      Cron.weeklyAt(WeekDay.Monday, 9),
      "0 9 * * 1",
      "Weekly on Monday at 9:00 should match pattern",
    );
    assert.strictEqual(
      Cron.weeklyAt(WeekDay.Friday, 16, 45),
      "45 16 * * 5",
      "Weekly on Friday at 16:45 should match pattern",
    );
    assert.strictEqual(
      Cron.weeklyAt(WeekDay.Sunday, 0),
      "0 0 * * 0",
      "Weekly on Sunday at 00:00 should match pattern",
    );
  });
});
