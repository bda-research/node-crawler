import { multiPriorityQueue } from "../lib/index.js";
import Cluster from "./cluster.js";

export type Task = {
    (done: () => void, limiter?: number): void;
};

export type TaskWrapper = {
    next: Task;
    rateLimiterId?: number;
};

export type RateLimiterOptions = {
    maxConnections: number;
    rateLimit: number;
    priorityLevels: number;
    defaultPriority: number;
    cluster?: Cluster;
};

class RateLimiter {
    private _waitingTasks: multiPriorityQueue<Task>;
    private _cluster?: Cluster;

    public id?: number;
    public maxConnections: number;
    public nextRequestTime: number;
    public rateLimit: number;
    public runningSize: number;
    public priorityLevels: number;
    public defaultPriority: number;

    constructor({ maxConnections, rateLimit, priorityLevels = 1, defaultPriority = 0, cluster }: RateLimiterOptions) {
        if (!Number.isInteger(maxConnections) || !Number.isInteger(rateLimit) || !Number.isInteger(priorityLevels)) {
            throw new Error("maxConnections, rateLimit and priorityLevels must be positive integers");
        }
        this.maxConnections = maxConnections;
        this.priorityLevels = priorityLevels;
        this.defaultPriority = Number.isInteger(defaultPriority)
            ? defaultPriority
            : Math.floor(this.priorityLevels / 2);
        this.defaultPriority >= priorityLevels ? priorityLevels - 1 : defaultPriority;
        this.nextRequestTime = Date.now();

        this._waitingTasks = new multiPriorityQueue<Task>(priorityLevels);
        this._cluster = cluster;

        this.rateLimit = rateLimit;
        this.runningSize = 0;
    }

    get waitingSize(): number {
        return this._waitingTasks.size();
    }

    hasWaitingTasks(): boolean {
        return this.waitingSize > 0 || (this._cluster !== void 0 && this._cluster.hasWaitingTasks());
    }

    setId(id: number) {
        this.id = id;
    }

    setRateLimit(rateLimit: number): void {
        if (!Number.isInteger(rateLimit) || rateLimit < 0) {
            throw new Error("rateLimit must be non negative integers");
        }
        this.rateLimit = rateLimit;
        if (this.rateLimit > 0) this.maxConnections = 1;
    }

    submit(options: { priority: number } | number, task: Task): void {
        let priority = typeof options === "number" ? options : options.priority;
        priority = Number.isInteger(priority) ? priority : this.defaultPriority;
        priority = Math.min(priority, this.priorityLevels - 1);
        this._waitingTasks.enqueue(task, priority);
        this._schedule();
    }

    private _schedule(): void {
        if (this.runningSize < this.maxConnections && this.hasWaitingTasks()) {
            ++this.runningSize;
            const delay = Math.max(this.nextRequestTime - Date.now(), 0);
            this.nextRequestTime = Date.now() + delay + this.rateLimit;

            const { next, rateLimiterId } = this.dequeue() as TaskWrapper;
            setTimeout(() => {
                const done = () => {
                    --this.runningSize;
                    this._schedule();
                };
                next(done, rateLimiterId);
            }, delay);
        }
    }

    directDequeue(): Task {
        return this._waitingTasks.dequeue() as Task;
    }

    dequeue(): TaskWrapper | undefined {
        if (this.waitingSize) {
            return {
                next: this._waitingTasks.dequeue() as Task,
                rateLimiterId: undefined,
            };
        }
        return this._cluster?.dequeue();
    }
}

export default RateLimiter;
