/**
 * A generic Queue class implementing a First-In, First-Out (FIFO) data structure.
 * @template T The type of elements held in the queue.
 */
export class Queue<T> {
  private elements: T[] = [];

  /**
   * Adds an element to the end of the queue.
   * @param element The element to add.
   */
  public enqueue(element: T): void {
    this.elements.push(element);
  }

  /**
   * Removes and returns the element at the beginning of the queue.
   * Returns `undefined` if the queue is empty.
   * @returns The removed element or undefined.
   */
  public dequeue(): T | undefined {
    return this.elements.shift();
  }

  /**
   * Returns the element at the beginning of the queue without removing it.
   * Returns `undefined` if the queue is empty.
   * @returns The element at the front of the queue or undefined.
   */
  public peek(): T | undefined {
    return this.elements[0];
  }

  /**
   * Checks if the queue is empty.
   * @returns `true` if the queue has no elements, `false` otherwise.
   */
  public isEmpty(): boolean {
    return this.elements.length === 0;
  }

  /**
   * Gets the number of elements in the queue.
   * @returns The size of the queue.
   */
  public get size(): number {
    return this.elements.length;
  }
}
