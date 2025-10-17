import { describe, it } from "node:test";
import assert from "node:assert";
import { Queue } from "#utils";

describe("Queue", () => {
  // Test basic enqueue and dequeue operations (FIFO order).
  it("should enqueue and dequeue elements correctly (FIFO)", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    assert.strictEqual(queue.dequeue(), 1, "First element dequeued should be 1");
    assert.strictEqual(queue.dequeue(), 2, "Second element dequeued should be 2");
    assert.strictEqual(queue.isEmpty(), true, "Queue should be empty after dequeuing all elements");
  });

  // Test if the size property accurately reflects the number of elements.
  it("should return correct size", () => {
    const queue = new Queue<string>();
    assert.strictEqual(queue.size, 0, "Initial size should be 0");
    queue.enqueue("a");
    queue.enqueue("b");
    assert.strictEqual(queue.size, 2, "Size should be 2 after enqueuing two elements");
    queue.dequeue();
    assert.strictEqual(queue.size, 1, "Size should be 1 after one dequeue");
    queue.clear();
    assert.strictEqual(queue.size, 0, "Size should be 0 after clear");
  });

  // Test peeking at the next element without removing it.
  it("should peek elements without removing them", () => {
    const queue = new Queue<string>();
    queue.enqueue("x");
    queue.enqueue("y");
    assert.strictEqual(queue.peek(), "x", "Peek should return the first element");
    assert.strictEqual(queue.size, 2, "Size should remain 2 after peek");
    assert.strictEqual(queue.peek(), "x", "Peek again should return the same element");
  });

  // Test the isEmpty method on an empty and non-empty queue.
  it("should correctly report if it is empty", () => {
    const queue = new Queue<number>();
    assert.strictEqual(queue.isEmpty(), true, "New queue should be empty");
    queue.enqueue(1);
    assert.strictEqual(queue.isEmpty(), false, "Queue should not be empty after enqueue");
    queue.dequeue();
    assert.strictEqual(
      queue.isEmpty(),
      true,
      "Queue should be empty after dequeueing the only element",
    );
  });

  // Test clearing all elements from the queue.
  it("should clear the queue", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);
    assert.strictEqual(queue.size, 3, "Size should be 3 before clear");
    queue.clear();
    assert.strictEqual(queue.size, 0, "Size should be 0 after clear");
    assert.strictEqual(queue.isEmpty(), true, "Queue should be empty after clear");
    assert.strictEqual(queue.peek(), undefined, "Peek should return undefined after clear");
    assert.strictEqual(queue.dequeue(), undefined, "Dequeue should return undefined after clear");
  });

  // Test converting the queue to an array.
  it("should convert to an array in FIFO order", () => {
    const queue = new Queue<string>();
    queue.enqueue("first");
    queue.enqueue("second");
    queue.enqueue("third");
    const arr = queue.toArray();
    assert.deepStrictEqual(
      arr,
      ["first", "second", "third"],
      "Array should contain elements in FIFO order",
    );
    assert.strictEqual(queue.size, 3, "toArray should not modify the queue size");
  });

  // Test dequeuing from an empty queue.
  it("should return undefined when dequeuing an empty queue", () => {
    const queue = new Queue<number>();
    assert.strictEqual(
      queue.dequeue(),
      undefined,
      "Dequeue on empty queue should return undefined",
    );
    assert.strictEqual(queue.size, 0, "Size should remain 0");
  });

  // Test peeking an empty queue.
  it("should return undefined when peeking an empty queue", () => {
    const queue = new Queue<number>();
    assert.strictEqual(queue.peek(), undefined, "Peek on empty queue should return undefined");
    assert.strictEqual(queue.size, 0, "Size should remain 0");
  });

  // Test iterating over the queue using for...of.
  it("should be iterable", () => {
    const queue = new Queue<string>();
    const items = ["one", "two", "three"];
    items.forEach((item) => queue.enqueue(item));

    const iteratedItems: string[] = [];
    for (const item of queue) {
      iteratedItems.push(item);
    }
    assert.deepStrictEqual(iteratedItems, items, "Iterator should yield elements in FIFO order");
    assert.strictEqual(queue.size, items.length, "Iteration should not modify the queue size");
  });

  // Test enqueue/dequeue operations exceeding initial capacity to check resizing.
  it("should handle resizing correctly when growing", () => {
    const initialCapacity = 4; // Use a small capacity for testing
    const queue = new Queue<number>(initialCapacity);
    const elementsToTest = initialCapacity * 3; // More elements than initial capacity * 2
    const expectedOrder: number[] = [];

    // Enqueue more elements than capacity to trigger growth
    for (let i = 0; i < elementsToTest; i++) {
      queue.enqueue(i);
      expectedOrder.push(i);
    }
    assert.strictEqual(
      queue.size,
      elementsToTest,
      `Size should be ${elementsToTest} after growing`,
    );

    // Dequeue all elements to verify order and integrity after growth
    const dequeuedOrder: number[] = [];
    while (!queue.isEmpty()) {
      dequeuedOrder.push(queue.dequeue()!);
    }
    assert.deepStrictEqual(
      dequeuedOrder,
      expectedOrder,
      "Elements should maintain FIFO order after growth",
    );
    assert.strictEqual(
      queue.isEmpty(),
      true,
      "Queue should be empty after dequeuing all grown elements",
    );
  });

  // but we can test a scenario where it might shrink.
  it("should maintain integrity during potential shrink scenarios", () => {
    const queue = new Queue<number>(32); // Start with a larger capacity

    // Fill it up significantly
    for (let i = 0; i < 30; i++) {
      queue.enqueue(i);
    }
    assert.strictEqual(queue.size, 30);

    // Dequeue most elements, potentially triggering a shrink
    const expectedAfterDequeue: number[] = [];
    for (let i = 0; i < 25; i++) {
      queue.dequeue();
    }
    for (let i = 25; i < 30; i++) {
      expectedAfterDequeue.push(i);
    }

    assert.strictEqual(queue.size, 5, "Size should be 5 after dequeuing most elements");

    // Add more elements
    queue.enqueue(30);
    queue.enqueue(31);
    expectedAfterDequeue.push(30, 31);

    assert.strictEqual(queue.size, 7, "Size should be 7 after adding more elements");

    // Verify remaining elements are correct
    const finalArray = queue.toArray();
    assert.deepStrictEqual(
      finalArray,
      expectedAfterDequeue,
      "Elements should be correct after potential shrink and re-enqueue",
    );
  });
});
