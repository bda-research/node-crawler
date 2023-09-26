import RateLimiter from "./rateLimiter.js";

// bottleneck.ts
class Limiter {
    private _name: string;
    private _waitingClients: PriorityQueue;
    private _priorityRange: number;
    private _defaultPriority: number;
    private _nextRequest: number;
    private _tasksRunning: number;

    constructor(
        private maxConcurrent: number,
        private rateLimit: number,
        priorityRange: number,
        defaultPriority: number,
        private cluster?: Cluster
    ) {
        if (isNaN(maxConcurrent) || isNaN(rateLimit)) {
            throw "maxConcurrent and rateLimit must be numbers";
        }

        this._priorityRange = priorityRange || 1;
        if (isNaN(this._priorityRange)) {
            throw "priorityRange must be a number";
        }
        this._priorityRange = parseInt(this._priorityRange.toString());
        this._defaultPriority = defaultPriority ? defaultPriority : Math.floor(this._priorityRange / 2);
        if (isNaN(this._defaultPriority)) {
            throw "defaultPriority must be a number";
        }
        this._defaultPriority =
            this._defaultPriority >= this._priorityRange ? this._priorityRange - 1 : this._defaultPriority;
        this._defaultPriority = parseInt(this._defaultPriority.toString());

        this._waitingClients = new PriorityQueue(this._priorityRange);
        this._nextRequest = Date.now();
        this._tasksRunning = 0;
    }

    public setName(name: string): void {
        this._name = name;
    }

    public setRateLimit(rateLimit: number): void {
        if (isNaN(rateLimit)) {
            throw "rateLimit must be a number";
        }
        this.rateLimit = parseInt(rateLimit.toString());
        if (this.rateLimit > 0) {
            this.maxConcurrent = 1;
        }
    }

    public submit(options: number | { priority: number }, clientCallback: Function): void {
        const priority = typeof options === "number" ? parseInt(options.toString()) : options.priority;
        const finalPriority = Number.isInteger(priority) ? priority : this._defaultPriority;
        this._waitingClients.enqueue(clientCallback, finalPriority);
        this._tryToRun();
    }

    private _tryToRun(): void {
        if (this._tasksRunning < this.maxConcurrent && this.hasWaitingClients()) {
            ++this._tasksRunning;
            const wait = Math.max(this._nextRequest - Date.now(), 0);
            this._nextRequest = Date.now() + wait + this.rateLimit;
            const obj = this.dequeue();
            const next = obj.next;
            const limiter = obj.limiter;
            setTimeout(() => {
                const done = () => {
                    --this._tasksRunning;
                    this._tryToRun();
                };
                next(done, limiter);
            }, wait);
        }
    }

    public hasWaitingClients(): boolean {
        if (this._waitingClients.size()) {
            return true;
        }
        if (this.cluster && this.cluster.waitingClients) {
            return true;
        }
        return false;
    }

    public dequeue(): { next: Function; limiter: null } {
        if (this._waitingClients.size()) {
            return {
                next: this._waitingClients.dequeue(),
                limiter: null,
            };
        }
        return this.cluster.dequeue(this._name);
    }
}
