export interface AbstractNode {
    next?: AbstractNode | null;
    prev?: AbstractNode | null;
}
declare class Queue<T> {
    private _dummyHead;
    private _dummyTail;
    private _length;
    constructor();
    /**
     * Adds an element to the back of the Queue.
     * @param {*} element
     * @return {number} The new length of the Queue.
     */
    enqueue(value: T): number;
    /**
     * Removes the element at the front of the Queue.
     * @return {*} The element at the front of the Queue.
     */
    dequeue(): T | undefined;
    /**
     * Returns true if the Queue has no elements.
     * @return {boolean} Whether the Queue has no elements.
     */
    isEmpty(): boolean;
    /**
     * Returns the element at the front of the Queue.
     * @return {*} The element at the front of the Queue.
     */
    front(): T | undefined;
    /**
     * Returns the element at the back of the Queue.
     * @return {*} The element at the back of the Queue.
     */
    back(): T | undefined;
    /**
     * Returns the number of elements in the Queue.
     * @return {number} Number of elements in the Queue.
     */
    get length(): number;
    /**
     * Returns the number of elements in the Queue (same as length).
     * @return {number} Number of elements in the Queue.
     */
    get size(): number;
}
export default Queue;
//# sourceMappingURL=queue.d.ts.map