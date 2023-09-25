import RateLimiter, { RateLimiterOptions } from "./rateLimiter.js";

export interface ClusterOptions extends RateLimiterOptions {
    homogeneous?: boolean;
}

class Cluster {
    private _limiters: Record<string, RateLimiter>;
    private _maxConcurrency: number;
    private _rateLimit: number;
    private _priorityCount: number;
    private _defaultPriority: number;
    private _homogeneous: boolean;
    private _interval: NodeJS.Timeout | null = null;
    constructor({ maxConcurrency, rateLimit, priorityCount, defaultPriority, homogeneous }: ClusterOptions) {
        this._maxConcurrency = maxConcurrency;
        this._rateLimit = rateLimit;
        this._priorityCount = priorityCount;
        this._defaultPriority = defaultPriority;
        this._homogeneous = homogeneous || false;
        this._limiters = {};
    }

    getLimiter(id: string = ""): RateLimiter {
        if (!this._limiters[id]) {
            this._limiters[id] = new RateLimiter({
                "maxConcurrency": this._maxConcurrency,
                "rateLimit": this._rateLimit,
                "priorityCount": this._priorityCount,
                "defaultPriority": this._defaultPriority,
                "cluster": this,
            });
            this._limiters[id].setId(id);
        }
        return this._limiters[id];
    }

    delete(id: string = ""): boolean {
        return delete this._limiters[id];
    }

    getLimiterIdList(): string[] {
        return Object.keys(this._limiters);
    }

    private getWaitingTasks(): number {
        let waitingTasks = 0;
        const idList = this.getLimiterIdList();
        idList.forEach(id => {
            waitingTasks += this._limiters[id].size();
        });
        return waitingTasks;
    }

    private getUnfinishedTasks(): number {
        let unfinishedTasks = 0;
        const idList = this.getLimiterIdList();
        idList.forEach(id => {
            unfinishedTasks += this._limiters[id].size() + this._limiters[id].runningTasksNumber;
        });
        return unfinishedTasks;
    }

    dequeue(name: string): { next: (done: () => void, limiter: string | null) => void; limiter: string } | undefined {
        const idList = this.getLimiterIdList();
        idList.forEach(id => {
            if (this._limiters[id].size()) {
                return {
                    next: this._limiters[id].dequeue(),
                    limiter: id,
                };
            }
        })
    }

    get status(): string {
        const status: string[] = [];
        const idList = this.getLimiterIdList();
        idList.forEach(id => {
            status.push(
                [
                    "Id: " + id,
                    "running: " + this._limiters[id].runningTasksNumber,
                    "waiting: " + this._limiters[id].size(),
                ].join()
            );
        });
        return status.join(";");
    }

    startAutoCleanup(): void {
        const base = (this._interval = setInterval(() => {
            const time = Date.now();
            for (const id in this._limiters) {
                const limiter = this._limiters[id];
                if (limiter.nextRequestTime + 1000 * 60 * 5 < time) {
                    this.delete(id);
                }
            }
        }, 1000 * 30));
        if (typeof base.unref === "function") {
            base.unref();
        }
    }

    get empty(): boolean {
        return this.getUnfinishedTasks() === 0;
    }
}
export default Cluster;
