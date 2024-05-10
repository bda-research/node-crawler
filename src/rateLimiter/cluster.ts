import RateLimiter, { RateLimiterOptions, Task, TaskWrapper } from "./rateLimiter.js";

export type ClusterOptions = RateLimiterOptions & {
    homogeneous?: boolean;
};

class Cluster {
    private _rateLimiters: Record<number, RateLimiter>;
    private _homogeneous: boolean;
    private _interval: NodeJS.Timeout | null = null;

    public globalMaxConnections: number;
    public globalRateLimit: number;
    public globalpriorityLevels: number;
    public globalDefaultPriority: number;

    constructor({ maxConnections, rateLimit, priorityLevels, defaultPriority, homogeneous }: ClusterOptions) {
        this.globalMaxConnections = maxConnections;
        this.globalRateLimit = rateLimit;
        this.globalpriorityLevels = priorityLevels;
        this.globalDefaultPriority = defaultPriority;

        this._homogeneous = homogeneous || false;
        this._rateLimiters = {};
    }
    /**
     * Alternative to Old Cluster.prototype.key
     */
    getRateLimiter(id?: number): RateLimiter {
        id = id ?? 0;
        if (!this._rateLimiters[id]) {
            this._rateLimiters[id] = new RateLimiter({
                "maxConnections": this.globalMaxConnections,
                "rateLimit": this.globalRateLimit,
                "priorityLevels": this.globalpriorityLevels,
                "defaultPriority": this.globalDefaultPriority,
                "cluster": this._homogeneous ? this : void 0,
            });
            this._rateLimiters[id].setId(id);
            return this._rateLimiters[id];
        } else {
            return this._rateLimiters[id];
        }
    }

    hasRateLimiter(id: number): boolean {
        return !!this._rateLimiters[id];
    }

    deleteRateLimiter(id: number): boolean {
        id = id ?? 0;
        return delete this._rateLimiters[id];
    }

    /**
     * @deprecated use waitingSize instead
     */
    get waitingClients(): number {
        return this.waitingSize;
    }
    get waitingSize(): number {
        return Object.values(this._rateLimiters).reduce(
            (waitingCount, rateLimiter) => waitingCount + rateLimiter.waitingSize,
            0
        );
    }

    /**
     * @deprecated use unfinishedSize instead
     */
    get unfinishedClients(): number {
        return this.unfinishedSize;
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

    dequeue(): TaskWrapper | undefined {
        for (const rateLimiter of Object.values(this._rateLimiters)) {
            if (rateLimiter.waitingSize) {
                return {
                    "next": rateLimiter.directDequeue(),
                    "rateLimiterId": rateLimiter.id,
                };
            } else {
                // @todo The logic design of the code is not up to the mark.
                // this.deleteRateLimiter(rateLimiter.id as number);
            }
        }
        return void 0;
    }

    get status(): string {
        const status: string[] = [];
        Object.keys(this._rateLimiters).forEach(key => {
            const id = Number(key);
            status.push(
                [
                    "Id: " + id,
                    "running: " + this._rateLimiters[id].runningSize,
                    "waiting: " + this._rateLimiters[id].waitingSize,
                ].join()
            );
        });
        return status.join(";");
    }

    // startCleanup(): void {
    //     clearInterval(this._interval as NodeJS.Timeout);
    //     const base = (this._interval = setInterval(() => {
    //         const time = Date.now();
    //         Object.keys(this._rateLimiters).forEach(key => {
    //             const id = Number(key);
    //             const rateLimiter = this._rateLimiters[id];
    //             if (rateLimiter.nextRequestTime + 1000 * 60 * 5 < time) {
    //                 this.deleteRateLimiter(id);
    //             }
    //         });
    //     }, 1000 * 30));
    //     if (typeof base.unref === "function") {
    //         base.unref();
    //     }
    // }

    get empty(): boolean {
        return this.unfinishedSize === 0;
    }
}
export default Cluster;
