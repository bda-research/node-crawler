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

class Cluster {
    private limiters: Record<string, Limiter> = {};

    constructor(
        private maxConcurrent: number,
        private rateLimit: number,
        private priorityRange: number,
        private defaultPriority: number,
        private homogeneous: boolean
    ) {
        this.limiters = {};
    }

    public key(key: string = ""): Limiter {
        if (!this.limiters[key]) {
            this.limiters[key] = new RateLimiter({
                this.maxConcurrent,
                this.rateLimit,
                this.priorityRange,
                this.defaultPriority,
                this.homogeneous ? this : null
            });
            this.limiters[key].setName(key);
        }
        return this.limiters[key];
    }

    public deleteKey(key: string = ""): void {
        delete this.limiters[key];
    }

    public all(cb: Function): void {
        const results: any[] = [];
        for (const k in this.limiters) {
            if (this.limiters.hasOwnProperty(k)) {
                const v = this.limiters[k];
                results.push(cb(v));
            }
        }
    }

    public keys(): string[] {
        return Object.keys(this.limiters);
    }

    private _waitingClients(): number {
        let count = 0;
        const keys = this.keys();
        keys.forEach(key => {
            count += this.limiters[key].hasWaitingClients() ? 1 : 0;
        });
        return count;
    }

    private _unfinishedClients(): number {
        let count = 0;
        const keys = this.keys();
        keys.forEach(key => {
            count += this.limiters[key].hasWaitingClients() + this.limiters[key]._tasksRunning;
        });
        return count;
    }

    public dequeue(name: string): { next: Function; limiter: string } | null {
        const keys = this.keys();
        for (let i = 0; i < keys.length; ++i) {
            if (this.limiters[keys[i]].hasWaitingClients()) {
                return {
                    next: this.limiters[keys[i]].dequeue().next,
                    limiter: name,
                };
            }
        }
        return null;
    }

    private _status(): string {
        const status: string[] = [];
        const keys = this.keys();
        keys.forEach(key => {
            status.push(
                `key: ${key}, running: ${this.limiters[key]._tasksRunning}, waiting: ${
                    this.limiters[key].hasWaitingClients() ? 1 : 0
                }`
            );
        });
        return status.join(";");
    }

    public startAutoCleanup(): void {
        this.stopAutoCleanup();
        const base = (this.interval = setInterval(() => {
            const time = Date.now();
            for (const k in this.limiters) {
                if (this.limiters.hasOwnProperty(k)) {
                    const v = this.limiters[k];
                    if (v._nextRequest + 1000 * 60 * 5 < time) {
                        this.deleteKey(k);
                    }
                }
            }
        }, 1000 * 30));
        if (typeof base.unref === "function") {
            base.unref();
        }
    }

    public stopAutoCleanup(): void {
        clearInterval(this.interval);
    }

    public get waitingClients(): number {
        return this._waitingClients();
    }

    public get unfinishedClients(): number {
        return this._unfinishedClients();
    }

    public get status(): string {
        return this._status();
    }

    public get empty(): boolean {
        return this._unfinishedClients() > 0 ? false : true;
    }
}

export { Cluster };
