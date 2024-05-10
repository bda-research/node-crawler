// This part of the code uses a portion of the lago library
// Project: https://github.com/yangshun/lago
export interface AbstractNode {
    next?: AbstractNode | null;
    prev?: AbstractNode | null;
}

class Node<T> implements AbstractNode {
    public value: T;
    public next: AbstractNode | null;
    public prev: AbstractNode | null;

    constructor(value: T) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

class DummyHeadNode implements AbstractNode {
    public next: AbstractNode | null;

    constructor() {
        this.next = null;
    }
}

class DummyTailNode implements AbstractNode {
    public prev: AbstractNode | null;

    constructor() {
        this.prev = null;
    }
}

class Queue<T> {
    private _dummyHead: DummyHeadNode;
    private _dummyTail: DummyTailNode;
    private _length: number;

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
    enqueue(value: T): number {
        const node = new Node(value);
        const prevLast = this._dummyTail.prev as Node<T> | DummyHeadNode;
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
    dequeue(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        const node = this._dummyHead.next as Node<T>;
        const newFirst = node.next as Node<T> | DummyTailNode;
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
    isEmpty(): boolean {
        return this._length === 0;
    }

    /**
     * Returns the element at the front of the Queue.
     * @return {*} The element at the front of the Queue.
     */
    front(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        return (this._dummyHead.next as Node<T>).value;
    }

    /**
     * Returns the element at the back of the Queue.
     * @return {*} The element at the back of the Queue.
     */
    back(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        return (this._dummyTail.prev as Node<T>).value;
    }

    /**
     * Returns the number of elements in the Queue.
     * @return {number} Number of elements in the Queue.
     */
    get length(): number {
        return this._length;
    }
    /**
     * Returns the number of elements in the Queue (same as length).
     * @return {number} Number of elements in the Queue.
     */
    get size(): number {
        return this._length;
    }
}

export default Queue;