import RateLimiter, { RateLimiterOptions, TaskWrapper } from "./rateLimiter.js";
export type ClusterOptions = RateLimiterOptions & {
    homogeneous?: boolean;
};
declare class Cluster {
    private _rateLimiters;
    private _homogeneous;
    private _interval;
    globalMaxConnections: number;
    globalRateLimit: number;
    globalpriorityLevels: number;
    globalDefaultPriority: number;
    constructor({ maxConnections, rateLimit, priorityLevels, defaultPriority, homogeneous }: ClusterOptions);
    /**
     * Alternative to Old Cluster.prototype.key
     */
    getRateLimiter(id?: number): RateLimiter;
    hasRateLimiter(id: number): boolean;
    deleteRateLimiter(id: number): boolean;
    /**
     * @deprecated use waitingSize instead
     */
    get waitingClients(): number;
    get waitingSize(): number;
    /**
     * @deprecated use unfinishedSize instead
     */
    get unfinishedClients(): number;
    get unfinishedSize(): number;
    hasWaitingTasks(): boolean;
    dequeue(): TaskWrapper | undefined;
    get status(): string;
    get empty(): boolean;
}
export default Cluster;
//# sourceMappingURL=cluster.d.ts.map