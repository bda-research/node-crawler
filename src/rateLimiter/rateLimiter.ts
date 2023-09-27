import { multiPriorityQueue } from "../lib/index.js";
import Cluster from "./cluster.js";

export interface Task{ 
    (done: () => void, limiter: RateLimiter | null) : void 
};

export interface TaskWrapper {
    next: Task;
    rateLimiterId: string | null;
}

export interface RateLimiterOptions {
    maxConnections: number;
    rateLimit: number;
    priorityCount: number;
    defaultPriority: number;
    cluster?: Cluster;
}

class RateLimiter {
    private _waitingTasks: multiPriorityQueue<Task>;
    private _cluster?: Cluster;

    public id?: string;
    public maxConnections: number;
    public nextRequestTime: number;
    public rateLimit: number;
    public runningSize: number;
    public priorityCount: number;
    public defaultPriority: number;

    constructor({ maxConnections, rateLimit, priorityCount = 1, defaultPriority = 0, cluster }: RateLimiterOptions) {
        if (!Number.isInteger(maxConnections) || !Number.isInteger(rateLimit) || !Number.isInteger(priorityCount)) {
            throw new Error("maxConnections, rateLimit and priorityCount must be positive integers");
        }
        this.maxConnections = maxConnections;
        this.priorityCount = priorityCount;
        this.defaultPriority = Number.isInteger(defaultPriority) ? defaultPriority : Math.floor(this.priorityCount / 2);
        this.defaultPriority >= priorityCount ? priorityCount - 1 : defaultPriority;
        this.nextRequestTime = Date.now();

        this._waitingTasks = new multiPriorityQueue<Task>(priorityCount);
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

    setId(id: string) {
        this.id = id;
    }

    setRateLimit(rateLimit: number): void {
        if (!Number.isInteger(rateLimit) || rateLimit < 0) {
            throw new Error("rateLimit must be positive integers");
        }
        this.rateLimit = rateLimit;
    }

    submit(options: number | { priority: number }, task: Task): void {
        const priority = typeof options === "number" ? options : options.priority;
        const validPriority = Number.isInteger(priority) ? priority : this.defaultPriority;
        const clampedPriority = validPriority > this.priorityCount - 1 ? this.priorityCount - 1 : validPriority;
        this._waitingTasks.enqueue(task, clampedPriority);
        this._schedule_old();
    }

    private _schedule_old(): void {
        if (this.runningSize < this.maxConnections && this.hasWaitingTasks()) {
            ++this.runningSize;
            const delay = Math.max(this.nextRequestTime - Date.now(), 0);
            this.nextRequestTime = Date.now() + delay + this.rateLimit;

            const {next} = this.dequeue() as TaskWrapper;
            setTimeout(() => {
                const done = () => {
                    --this.runningSize;
                    this._schedule_old();
                };
                next(done, null);
            }, delay);
        }
    }

    dequeue(): TaskWrapper | undefined {
        if (this.waitingSize) {
            return {
                next: this._waitingTasks.dequeue() as Task,
                rateLimiterId: null,
            };
        }
        return this._cluster?.dequeue();
    }
}

export default RateLimiter;
