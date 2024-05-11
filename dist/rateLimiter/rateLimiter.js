import { multiPriorityQueue } from "../lib/index.js";
class RateLimiter {
    constructor({ maxConnections, rateLimit, priorityLevels = 1, defaultPriority = 0, cluster }) {
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
        this._waitingTasks = new multiPriorityQueue(priorityLevels);
        this._cluster = cluster;
        this.rateLimit = rateLimit;
        this.runningSize = 0;
    }
    get waitingSize() {
        return this._waitingTasks.size();
    }
    hasWaitingTasks() {
        return this.waitingSize > 0 || (this._cluster !== void 0 && this._cluster.hasWaitingTasks());
    }
    setId(id) {
        this.id = id;
    }
    setRateLimit(rateLimit) {
        if (!Number.isInteger(rateLimit) || rateLimit < 0) {
            throw new Error("rateLimit must be non negative integers");
        }
        this.rateLimit = rateLimit;
        if (this.rateLimit > 0)
            this.maxConnections = 1;
    }
    submit(options, task) {
        let priority = typeof options === "number" ? options : options.priority;
        priority = Number.isInteger(priority) ? priority : this.defaultPriority;
        priority = Math.min(priority, this.priorityLevels - 1);
        this._waitingTasks.enqueue(task, priority);
        this._schedule();
    }
    _schedule() {
        if (this.runningSize < this.maxConnections && this.hasWaitingTasks()) {
            ++this.runningSize;
            const delay = Math.max(this.nextRequestTime - Date.now(), 0);
            this.nextRequestTime = Date.now() + delay + this.rateLimit;
            const { next, rateLimiterId } = this.dequeue();
            setTimeout(() => {
                const done = () => {
                    --this.runningSize;
                    this._schedule();
                };
                next(done, rateLimiterId);
            }, delay);
        }
    }
    directDequeue() {
        return this._waitingTasks.dequeue();
    }
    dequeue() {
        if (this.waitingSize) {
            return {
                next: this._waitingTasks.dequeue(),
                rateLimiterId: undefined,
            };
        }
        return this._cluster?.dequeue();
    }
}
export default RateLimiter;
//# sourceMappingURL=rateLimiter.js.map