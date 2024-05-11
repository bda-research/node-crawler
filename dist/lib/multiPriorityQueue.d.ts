declare class multiPriorityQueue<T> {
    private _elements;
    private _size;
    constructor(priorities: number);
    size(): number;
    enqueue(value: T, priority: number): void;
    dequeue(): T | undefined;
}
export default multiPriorityQueue;
//# sourceMappingURL=multiPriorityQueue.d.ts.map