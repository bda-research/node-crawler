import Cluster from "./cluster.js";
export type Task = {
    (done: () => void, limiter?: number): void;
};
export type TaskWrapper = {
    next: Task;
    rateLimiterId?: number;
};
export type RateLimiterOptions = {
    maxConnections: number;
    rateLimit: number;
    priorityLevels: number;
    defaultPriority: number;
    cluster?: Cluster;
};
declare class RateLimiter {
    private _waitingTasks;
    private _cluster?;
    id?: number;
    maxConnections: number;
    nextRequestTime: number;
    rateLimit: number;
    runningSize: number;
    priorityLevels: number;
    defaultPriority: number;
    constructor({ maxConnections, rateLimit, priorityLevels, defaultPriority, cluster }: RateLimiterOptions);
    get waitingSize(): number;
    hasWaitingTasks(): boolean;
    setId(id: number): void;
    setRateLimit(rateLimit: number): void;
    submit(options: {
        priority: number;
    } | number, task: Task): void;
    private _schedule;
    directDequeue(): Task;
    dequeue(): TaskWrapper | undefined;
}
export default RateLimiter;
//# sourceMappingURL=rateLimiter.d.ts.map