import Queue from "./queue.js";

class multiPriorityQueue<T> {
    private _elements: Queue<T>[] = [];
    private _size: number;

    constructor(priorities: number) {
        priorities = Math.max(+priorities | 0, 1);
        for (let i = 0; i < priorities; i += 1) {
            this._elements.push(new Queue<T>());
        }
        this._size = 0;
    }

    get size(): number {
        if (this._size) return this._size;
        let totalSize = 0;
        for (const queue of this._elements) {
            totalSize += queue.length;
        }
        return (this._size = totalSize);
    }

    enqueue(value: T, priority: number): void {
        priority = (priority && +priority | 0) || 0;
        if (priority < 0 || priority >= this._elements.length) {
            priority = this._elements.length - 1;
            console.error(`Invalid priority: ${priority} must be between 0 and ${this._elements.length - 1}`);
        }
        this._elements[priority].enqueue(value);
        this._size++;
    }

    dequeue(): T | undefined {
        for (let i = 0; i < this._elements.length; i++) {
            if (this._elements[i].length > 0) {
                this._size--;
                return this._elements[i].dequeue();
            }
        }
        console.error("multiPriorityQueue is empty");
        return undefined;
    }
}
export default multiPriorityQueue;
