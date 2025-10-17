import { describe, it } from "node:test";
import assert from "node:assert";
import { Timer } from "#utils";

describe("Timer Utility", () => {
  // Test the .sec() method for converting seconds to milliseconds.
  it("should convert seconds to milliseconds correctly", () => {
    assert.strictEqual(Timer(1).sec(), 1000, "1 second should be 1000 ms");
    assert.strictEqual(Timer(15).sec(), 15000, "15 seconds should be 15000 ms");
    assert.strictEqual(Timer(0).sec(), 0, "0 seconds should be 0 ms");
    assert.strictEqual(Timer(60).sec(), 60000, "60 seconds should be 60000 ms");
  });

  // Test the .min() method for converting minutes to milliseconds.
  it("should convert minutes to milliseconds correctly", () => {
    assert.strictEqual(Timer(1).min(), 60 * 1000, "1 minute should be 60000 ms");
    assert.strictEqual(Timer(5).min(), 5 * 60 * 1000, "5 minutes should be 300000 ms");
    assert.strictEqual(Timer(0).min(), 0, "0 minutes should be 0 ms");
    assert.strictEqual(Timer(30).min(), 30 * 60 * 1000, "30 minutes should be 1800000 ms");
  });

  // Test the .hour() method for converting hours to milliseconds.
  it("should convert hours to milliseconds correctly", () => {
    assert.strictEqual(Timer(1).hour(), 60 * 60 * 1000, "1 hour should be 3600000 ms");
    assert.strictEqual(Timer(2).hour(), 2 * 60 * 60 * 1000, "2 hours should be 7200000 ms");
    assert.strictEqual(Timer(0).hour(), 0, "0 hours should be 0 ms");
    assert.strictEqual(Timer(12).hour(), 12 * 60 * 60 * 1000, "12 hours should be 43200000 ms");
  });

  // Test the .monthly() method (assuming 1 month = 30 days).
  it("should convert months (as 30 days) to milliseconds correctly", () => {
    const msPer30Days = 30 * 24 * 60 * 60 * 1000;
    assert.strictEqual(Timer(1).monthly(), msPer30Days, "1 month (30 days) should be correct ms");
    assert.strictEqual(
      Timer(3).monthly(),
      3 * msPer30Days,
      "3 months (90 days) should be correct ms",
    );
    assert.strictEqual(Timer(0).monthly(), 0, "0 months should be 0 ms");
  });

  // Test with non-integer values if relevant (though typically Timer is used with integers).
  it("should handle non-integer values", () => {
    assert.strictEqual(Timer(0.5).sec(), 500, "0.5 seconds should be 500 ms");
    assert.strictEqual(Timer(1.5).min(), 90 * 1000, "1.5 minutes should be 90000 ms");
  });
});
