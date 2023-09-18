class PriorityQueue<T> {
    private slots: T[][] = [];
    private total: number | null = null;

    constructor(size: number) {
        size = Math.max(+size | 0, 1);
        for (let i = 0; i < size; i += 1) {
            this.slots.push([]);
        }
    }

    size(): number {
        if (this.total === null) {
            this.total = 0;
            for (const slot of this.slots) {
                this.total += slot.length;
            }
        }
        return this.total;
    }

    enqueue(obj: T, priority: number): void {
        priority = (priority && +priority | 0) || 0;
        this.total = null;
        if (priority) {
            const priorityOrig = priority;
            if (priority < 0 || priority >= this.slots.length) {
                priority = this.slots.length - 1;
                console.error(`invalid priority: ${priorityOrig} must be between 0 and ${priority}`);
            }
        }
        this.slots[priority].push(obj);
    }

    dequeue(callback: (obj: T | null) => void): void {
        let obj: T | null = null;
        for (const slot of this.slots) {
            if (slot.length) {
                obj = slot.shift() || null;
                break;
            }
        }
        callback(obj);
    }
}

class RateLimiter {
    private name: string | undefined;
    private rateLimit: number;
    private maxConcurrent: number;
    private _waitingClients: PriorityQueue<(done: () => void, limiter: null) => void>;
    private _priorityRange: number;
    private _defaultPriority: number;
    private _nextRequest: number;
    private _tasksRunning: number;

    constructor(
        maxConcurrent: number,
        rateLimit: number,
        priorityRange: number,
        defaultPriority: number,
        cluster: any
    ) {
        if (isNaN(maxConcurrent) || isNaN(rateLimit)) {
            throw new Error("maxConcurrent and rateLimit must be numbers");
        }

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
        this._waitingClients = new PriorityQueue<(done: () => void, limiter: null) => void>(priorityRange);
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

export default Bottleneck;
