class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}
class DummyHeadNode {
    constructor() {
        this.next = null;
    }
}
class DummyTailNode {
    constructor() {
        this.prev = null;
    }
}
class Queue {
    constructor() {
        this._dummyHead = new DummyHeadNode();
        this._dummyTail = new DummyTailNode();
        this._dummyHead.next = this._dummyTail;
        this._dummyTail.prev = this._dummyHead;
        this._length = 0;
    }
    /**
     * Adds an element to the back of the Queue.
     * @param {*} element
     * @return {number} The new length of the Queue.
     */
    enqueue(value) {
        const node = new Node(value);
        const prevLast = this._dummyTail.prev;
        prevLast.next = node;
        node.prev = prevLast;
        node.next = this._dummyTail;
        this._dummyTail.prev = node;
        this._length++;
        return this._length;
    }
    /**
     * Removes the element at the front of the Queue.
     * @return {*} The element at the front of the Queue.
     */
    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        const node = this._dummyHead.next;
        const newFirst = node.next;
        this._dummyHead.next = newFirst;
        newFirst.prev = this._dummyHead;
        node.next = null;
        this._length--;
        return node.value;
    }
    /**
     * Returns true if the Queue has no elements.
     * @return {boolean} Whether the Queue has no elements.
     */
    isEmpty() {
        return this._length === 0;
    }
    /**
     * Returns the element at the front of the Queue.
     * @return {*} The element at the front of the Queue.
     */
    front() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this._dummyHead.next.value;
    }
    /**
     * Returns the element at the back of the Queue.
     * @return {*} The element at the back of the Queue.
     */
    back() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this._dummyTail.prev.value;
    }
    /**
     * Returns the number of elements in the Queue.
     * @return {number} Number of elements in the Queue.
     */
    get length() {
        return this._length;
    }
    /**
     * Returns the number of elements in the Queue (same as length).
     * @return {number} Number of elements in the Queue.
     */
    get size() {
        return this._length;
    }
}
export default Queue;
//# sourceMappingURL=queue.js.map