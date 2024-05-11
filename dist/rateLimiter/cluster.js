import RateLimiter from "./rateLimiter.js";
class Cluster {
    constructor({ maxConnections, rateLimit, priorityLevels, defaultPriority, homogeneous }) {
        this._interval = null;
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
    getRateLimiter(id) {
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
        }
        else {
            return this._rateLimiters[id];
        }
    }
    hasRateLimiter(id) {
        return !!this._rateLimiters[id];
    }
    deleteRateLimiter(id) {
        id = id ?? 0;
        return delete this._rateLimiters[id];
    }
    /**
     * @deprecated use waitingSize instead
     */
    get waitingClients() {
        return this.waitingSize;
    }
    get waitingSize() {
        return Object.values(this._rateLimiters).reduce((waitingCount, rateLimiter) => waitingCount + rateLimiter.waitingSize, 0);
    }
    /**
     * @deprecated use unfinishedSize instead
     */
    get unfinishedClients() {
        return this.unfinishedSize;
    }
    get unfinishedSize() {
        return Object.values(this._rateLimiters).reduce((unfinishedCount, rateLimiter) => unfinishedCount + rateLimiter.runningSize + rateLimiter.waitingSize, 0);
    }
    hasWaitingTasks() {
        return Object.values(this._rateLimiters).some(rateLimiter => rateLimiter.hasWaitingTasks());
    }
    dequeue() {
        for (const rateLimiter of Object.values(this._rateLimiters)) {
            if (rateLimiter.waitingSize) {
                return {
                    "next": rateLimiter.directDequeue(),
                    "rateLimiterId": rateLimiter.id,
                };
            }
            else {
                // @todo The logic design of the code is not up to the mark.
                // this.deleteRateLimiter(rateLimiter.id as number);
            }
        }
        return void 0;
    }
    get status() {
        const status = [];
        Object.keys(this._rateLimiters).forEach(key => {
            const id = Number(key);
            status.push([
                "Id: " + id,
                "running: " + this._rateLimiters[id].runningSize,
                "waiting: " + this._rateLimiters[id].waitingSize,
            ].join());
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
    get empty() {
        return this.unfinishedSize === 0;
    }
}
export default Cluster;
//# sourceMappingURL=cluster.js.map