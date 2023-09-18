class Cluster {
    private maxConcurrent: number;
    private rateLimit: number;
    private priorityRange: number;
    private defaultPriority: number;
    private homogeneous: boolean;
    private limiters: Record<string, Bottleneck> = {};
    private Bottleneck: any;
  
    constructor(maxConcurrent: number, rateLimit: number, priorityRange: number, defaultPriority: number, homogeneous: boolean) {
      this.maxConcurrent = maxConcurrent;
      this.rateLimit = rateLimit;
      this.priorityRange = priorityRange;
      this.defaultPriority = defaultPriority;
      this.homogeneous = homogeneous ? true : false;
      this.Bottleneck = require("./Bottleneck").default;
    }
  
    key(key: string = ""): Bottleneck {
      if (!this.limiters[key]) {
        this.limiters[key] = new this.Bottleneck(
          this.maxConcurrent,
          this.rateLimit,
          this.priorityRange,
          this.defaultPriority,
          this.homogeneous ? this : null
        );
        this.limiters[key].setName(key);
      }
      return this.limiters[key];
    }
  
    deleteKey(key: string = ""): boolean {
      return delete this.limiters[key];
    }
  
    all(cb: (limiter: Bottleneck) => any[]): any[] {
      const results: any[] = [];
      for (const k in this.limiters) {
        if (Object.prototype.hasOwnProperty.call(this.limiters, k)) {
          const v = this.limiters[k];
          results.push(cb(v));
        }
      }
      return results;
    }
  
    keys(): string[] {
      return Object.keys(this.limiters);
    }
  
    private _waitingClients(): number {
      let count = 0;
      const keys = this.keys();
      keys.forEach((key) => {
        count += this.limiters[key]._waitingClients.size();
      });
      return count;
    }
  
    private _unfinishedClients(): number {
      let count = 0;
      const keys = this.keys();
      keys.forEach((key) => {
        count += this.limiters[key]._waitingClients.size();
        count += this.limiters[key]._tasksRunning;
      });
      return count;
    }
  
    dequeue(name: string): { next: (done: () => void, limiter: string | null) => void; limiter: string } | undefined {
      const keys = this.keys();
      for (let i = 0; i < keys.length; ++i) {
        if (this.limiters[keys[i]]._waitingClients.size()) {
          return {
            next: this.limiters[keys[i]]._waitingClients.dequeue(),
            limiter: name,
          };
        }
      }
    }
  
    private _status(): string {
      const status: string[] = [];
      const keys = this.keys();
      keys.forEach((key) => {
        status.push([
          'key: ' + key,
          'running: ' + this.limiters[key]._tasksRunning,
          'waiting: ' + this.limiters[key]._waitingClients.size(),
        ].join());
      });
      return status.join(';');
    }
  
    startAutoCleanup(): void {
      this.stopAutoCleanup();
      const base = (this.interval = setInterval(() => {
        const time = Date.now();
        for (const k in this.limiters) {
          const v = this.limiters[k];
          if (v._nextRequest + 1000 * 60 * 5 < time) {
            this.deleteKey(k);
          }
        }
      }, 1000 * 30));
      if (typeof base.unref === "function") {
        base.unref();
      }
    }
  
    stopAutoCleanup(): void {
      clearInterval(this.interval);
    }
  
    get waitingClients(): number {
      return this._waitingClients();
    }
  
    get unfinishedClients(): number {
      return this._unfinishedClients();
    }
  
    get status(): string {
      return this._status();
    }
  
    get empty(): boolean {
      return this._unfinishedClients() > 0 ? false : true;
    }
  }
  
  export default Cluster;
  