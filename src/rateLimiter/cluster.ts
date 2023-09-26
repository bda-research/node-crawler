import RateLimiter, { RateLimiterOptions } from "./rateLimiter.js";

export interface ClusterOptions extends RateLimiterOptions {
    homogeneous?: boolean;
}

class Cluster {
    private _rateLimiters: Record<string, RateLimiter>;
    private _homogeneous: boolean;
    private _interval: NodeJS.Timeout | null = null;

    public globalMaxConcurrency: number;
    public globalRateLimit: number;
    public globalPriorityCount: number;
    public globalDefaultPriority: number;

    constructor({ maxConcurrency, rateLimit, priorityCount, defaultPriority, homogeneous }: ClusterOptions) {
        this.globalMaxConcurrency = maxConcurrency;
        this.globalRateLimit = rateLimit;
        this.globalPriorityCount = priorityCount;
        this.globalDefaultPriority = defaultPriority;

        this._homogeneous = homogeneous || false;
        this._rateLimiters = {};
    }

    createRateLimiter(id: string = ""): RateLimiter | undefined {
        if (!this._rateLimiters[id]) {
            this._rateLimiters[id] = new RateLimiter({
                "maxConcurrency": this.globalMaxConcurrency,
                "rateLimit": this.globalRateLimit,
                "priorityCount": this.globalPriorityCount,
                "defaultPriority": this.globalDefaultPriority,
                "cluster": this,
            });
            this._rateLimiters[id].setId(id);
            return this._rateLimiters[id];
        } else {
            console.error("RateLimiter with id: " + id + " already exists");
            return void 0;
        }
    }
    hasRateLimiter(id: string = ""): boolean {
        return !!this._rateLimiters[id];
    }

    deleteRateLimiter(id: string = ""): boolean {
        return delete this._rateLimiters[id];
    }

    get waitingSize(): number {
        return Object.values(this._rateLimiters).reduce(
            (waitingCount, rateLimiter) => waitingCount + rateLimiter.waitingSize,
            0
        );
    }

    get unfinishedSize(): number {
        return Object.values(this._rateLimiters).reduce(
            (unfinishedCount, rateLimiter) => unfinishedCount + rateLimiter.runningSize + rateLimiter.waitingSize,
            0
        );
    }

    hasWaitingTasks(): boolean {
        return Object.values(this._rateLimiters).some(rateLimiter => rateLimiter.hasWaitingTasks());
    }

    dequeue(): { next: (done: () => void, rateLimiter: string | null) => void; rateLimiterId: string } | undefined {
        Object.keys(this._rateLimiters).forEach(id => {
            if (this._rateLimiters[id].waitingSize) {
                return {
                    next: this._rateLimiters[id].dequeue(),
                    rateLimiterId: id,
                };
            } else delete this._rateLimiters[id];
        });
        return void 0;
    }

    get status(): string {
        const status: string[] = [];
        Object.keys(this._rateLimiters).forEach(id => {
            status.push(
                [
                    "Id: " + id,
                    "running: " + this._rateLimiters[id].runningTasksNumber,
                    "waiting: " + this._rateLimiters[id].size(),
                ].join()
            );
        });
        return status.join(";");
    }

    startCleanup(): void {
        clearInterval(this._interval as NodeJS.Timeout);
        const base = (this._interval = setInterval(() => {
            const time = Date.now();
            Object.keys(this._rateLimiters).forEach(id => {
                const rateLimiter = this._rateLimiters[id];
                if (rateLimiter.nextRequestTime + 1000 * 60 * 5 < time) {
                    this.deleteLimiter(id);
                }
            });
        }, 1000 * 30));
        if (typeof base.unref === "function") {
            base.unref();
        }
    }

    get empty(): boolean {
        return this.getUnfinishedCount() === 0;
    }
}
export default Cluster;
