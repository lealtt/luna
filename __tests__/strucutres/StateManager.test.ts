import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { StateManager } from "#discord/structures";
import { Timer } from "#utils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("StateManager", () => {
  let stateManager: StateManager<{ value: string }>;

  // Create a new StateManager instance before each test
  beforeEach(() => {
    stateManager = new StateManager<{ value: string }>({
      name: "TestState",
      maxSize: 3, // Use a small size for eviction tests
      defaultTTL: Timer(100).sec(), // 100 seconds default TTL for predictability
      cleanupInterval: Timer(10).sec(), // Fast cleanup for testing
    });
  });

  // Clean up timers after each test to prevent leaks
  afterEach(() => {
    stateManager.destroy(); // Stops internal cleanup timer
  });

  // Test setting and getting a value.
  it("should set and get a value correctly", () => {
    const data = { value: "test1" };
    const id = stateManager.set(data);
    const retrievedData = stateManager.get(id);
    assert.deepStrictEqual(retrievedData, data, "Retrieved data should match the set data");
    assert.strictEqual(stateManager.has(id), true, "Should report having the valid ID");
  });

  // Test getting a non-existent value.
  it("should return undefined for non-existent id", () => {
    const retrievedData = stateManager.get("non-existent-id");
    assert.strictEqual(
      retrievedData,
      undefined,
      "Getting a non-existent ID should return undefined",
    );
    assert.strictEqual(
      stateManager.has("non-existent-id"),
      false,
      "Should report not having the non-existent ID",
    );
  });

  // Test if data expires after the TTL.
  it("should return undefined for expired id", async () => {
    const shortTTL = 50; // 50 ms TTL
    const data = { value: "expire-me" };
    const id = stateManager.set(data, shortTTL);

    assert.strictEqual(stateManager.has(id), true, "Should have the ID immediately after set");
    await wait(shortTTL + 10); // Wait slightly longer than TTL
    assert.strictEqual(
      stateManager.get(id),
      undefined,
      "Getting expired ID should return undefined",
    );
    assert.strictEqual(
      stateManager.has(id),
      false,
      "Should report not having the expired ID after TTL",
    );
  });

  // Test updating an existing value.
  it("should update an existing value", () => {
    const initialData = { value: "initial" };
    const id = stateManager.set(initialData);
    const updateSuccess = stateManager.update(id, { value: "updated" });
    const retrievedData = stateManager.get(id);

    assert.strictEqual(updateSuccess, true, "Update should return true for existing ID");
    assert.deepStrictEqual(
      retrievedData,
      { value: "updated" },
      "Retrieved data should reflect the update",
    );
  });

  // Test updating a non-existent value.
  it("should fail to update non-existent id", () => {
    const updateSuccess = stateManager.update("non-existent-id", { value: "updated" });
    assert.strictEqual(updateSuccess, false, "Update should return false for non-existent ID");
  });

  // Test deleting a value.
  it("should delete a value", () => {
    const data = { value: "to-delete" };
    const id = stateManager.set(data);
    assert.strictEqual(stateManager.has(id), true, "Should have the ID before delete");
    const deleteSuccess = stateManager.delete(id);
    assert.strictEqual(deleteSuccess, true, "Delete should return true for existing ID");
    assert.strictEqual(stateManager.has(id), false, "Should not have the ID after delete");
    assert.strictEqual(
      stateManager.get(id),
      undefined,
      "Getting deleted ID should return undefined",
    );
    const deleteAgainSuccess = stateManager.delete(id);
    assert.strictEqual(deleteAgainSuccess, false, "Deleting again should return false");
  });

  // Test the 'touch' method to extend TTL.
  it("should extend TTL with touch", async () => {
    const shortTTL = 100; // 100 ms
    const data = { value: "touch-me" };
    const id = stateManager.set(data, shortTTL);

    await wait(shortTTL / 2); // Wait half the TTL
    const touchSuccess = stateManager.touch(id); // Touch to reset TTL (using defaultTTL here)
    assert.strictEqual(touchSuccess, true, "Touch should succeed for existing ID");

    await wait(shortTTL / 2 + 10); // Wait past the original expiration time
    assert.ok(stateManager.get(id), "Should still get data after original TTL because of touch");
  });

  // Test the automatic cleanup of expired entries.
  it("should automatically clean up expired entries", async () => {
    // Mock the cleanup interval to run faster for the test
    stateManager.destroy(); // Stop the original timer
    stateManager = new StateManager<{ value: string }>({
      name: "TestStateCleanup",
      defaultTTL: 50, // 50 ms TTL
      cleanupInterval: 60, // Cleanup runs after 60ms
    });

    const id1 = stateManager.set({ value: "e1" });
    const id2 = stateManager.set({ value: "e2" });

    await wait(70); // Wait for TTL and cleanup interval to pass

    // Force cleanup check (though the interval should have run)
    stateManager.cleanup();

    assert.strictEqual(stateManager.has(id1), false, "Expired entry 1 should be cleaned up");
    assert.strictEqual(stateManager.has(id2), false, "Expired entry 2 should be cleaned up");
    assert.strictEqual(stateManager.getStats().size, 0, "Size should be 0 after cleanup");
  });

  // Test LRU eviction when maxSize is exceeded.
  it("should evict least recently used entry when maxSize is exceeded", () => {
    const id1 = stateManager.set({ value: "first" }); // Least recently used
    wait(10); // Small delay to ensure different access times
    const id2 = stateManager.set({ value: "second" });
    wait(10);
    const id3 = stateManager.set({ value: "third" }); // Most recently used (set)

    assert.strictEqual(stateManager.getStats().size, 3, "Size should be at maxSize (3)");

    // Access the second element to make it more recently used than the first
    stateManager.get(id2);
    wait(10);

    // Add a fourth element, which should trigger eviction of the LRU (id1)
    const id4 = stateManager.set({ value: "fourth" });

    assert.strictEqual(
      stateManager.getStats().size,
      3,
      "Size should remain at maxSize (3) after eviction",
    );
    assert.strictEqual(stateManager.has(id1), false, "LRU entry (id1) should have been evicted");
    assert.strictEqual(stateManager.has(id2), true, "Entry id2 should still exist");
    assert.strictEqual(stateManager.has(id3), true, "Entry id3 should still exist");
    assert.strictEqual(stateManager.has(id4), true, "Newly added entry id4 should exist");
  });

  // Test getStats method
  it("should return stats correctly", () => {
    stateManager.set({ value: "s1" });
    stateManager.set({ value: "s2" });
    const id3 = stateManager.set({ value: "s3" });
    stateManager.get(id3); // Hit
    stateManager.get("non-existent"); // Miss

    const stats = stateManager.getStats();

    assert.strictEqual(stats.size, 3, "Stats size should be 3");
    assert.strictEqual(stats.maxSize, 3, "Stats maxSize should be 3");
    assert.strictEqual(stats.hits, 1, "Stats hits should be 1");
    assert.strictEqual(stats.misses, 1, "Stats misses should be 1");
    assert.strictEqual(stats.hitRate, "50.00%", "Stats hitRate should be 50.00%");
  });
});
