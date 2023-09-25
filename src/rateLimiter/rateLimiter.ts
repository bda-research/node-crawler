import {multiPriorityQueue} from "../lib/index.js";


class RateLimiter {
    private _waitingClients: multiPriorityQueue<(done: () => void, limiter: null) => void>;
    private _priorityRange: number;
    private _defaultPriority: number;
    private _nextRequest: number;
    private _tasksRunning: number;

    public name: string | undefined;
    public rateLimit: number;
    public maxConcurrent: number;

    constructor(
        maxConcurrent: number,
        rateLimit: number,
        priorityRange: number = 1,
        defaultPriority: number,
        cluster: any
    ) {
        // if (isNaN(maxConcurrent) || isNaN(rateLimit)) {
        //     throw new Error("maxConcurrent and rateLimit must be numbers");
        // }
        // bug
        if(typeof maxConcurrent !== "number" || isNaN(maxConcurrent) || typeof rateLimit !== "number" || isNaN(rateLimit)) {


        

        priorityRange = priorityRange || 1;
        if (isNaN(priorityRange)) {
            throw new Error("priorityRange must be a number");
        }
        priorityRange = parseInt(priorityRange.toString(), 10);
        defaultPriority = defaultPriority ? defaultPriority : Math.floor(priorityRange / 2);
        if (isNaN(defaultPriority)) {
            throw new Error("defaultPriority must be a number");
        }
        defaultPriority = defaultPriority >= priorityRange ? priorityRange - 1 : defaultPriority;
        defaultPriority = parseInt(defaultPriority.toString(), 10);

        this.name = undefined;
        this.rateLimit = parseInt(rateLimit.toString(), 10);
        this.maxConcurrent = this.rateLimit ? 1 : parseInt(maxConcurrent.toString(), 10);
        this._waitingClients = new multiPriorityQueue<(done: () => void, limiter: null) => void>(priorityRange);
        this._priorityRange = priorityRange;
        this._defaultPriority = defaultPriority;
        this._nextRequest = Date.now();
        this._tasksRunning = 0;
        this.cluster = cluster;
    }

    setName(name: string): void {
        this.name = name;
    }

    setRateLimit(rateLimit: number): void {
        if (isNaN(rateLimit)) {
            throw new Error("rateLimit must be a number");
        }
        this.rateLimit = parseInt(rateLimit.toString(), 10);
        if (this.rateLimit > 0) {
            this.maxConcurrent = 1;
        }
    }

    submit(options: number | { priority: number }, clientCallback: (done: () => void, limiter: null) => void): void {
        const priority = typeof options === "number" ? parseInt(options.toString(), 10) : options.priority;
        const validPriority = Number.isInteger(priority) ? priority : this._defaultPriority;
        const clampedPriority = validPriority > this._priorityRange - 1 ? this._priorityRange - 1 : validPriority;
        this._waitingClients.enqueue(clientCallback, clampedPriority);
        this._tryToRun();
    }

    private _tryToRun(): void {
        if (this._tasksRunning < this.maxConcurrent && this.hasWaitingClients()) {
            ++this._tasksRunning;
            const wait = Math.max(this._nextRequest - Date.now(), 0);
            this._nextRequest = Date.now() + wait + this.rateLimit;
            const obj = this.dequeue();
            const next = obj.next;
            setTimeout(() => {
                const done = () => {
                    --this._tasksRunning;
                    this._tryToRun();
                };
                next(done, null);
            }, wait);
        }
    }

    hasWaitingClients(): boolean {
        if (this._waitingClients.size()) {
            return true;
        }
        if (this.cluster && this.cluster._waitingClients()) {
            return true;
        }
        return false;
    }

    dequeue(): { next: (done: () => void, limiter: null) => void; limiter: null } {
        if (this._waitingClients.size()) {
            return {
                next: this._waitingClients.dequeue(),
                limiter: null,
            };
        }
        return this.cluster.dequeue(this.name);
    }
}

export default RateLimiter;
