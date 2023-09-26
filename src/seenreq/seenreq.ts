interface SeenreqOptions {
    repo?: string;
    normalizer?: string | string[];
}

class Seenreq {
    private repo: any;
    private normalizers: any[];
    private globalOptions: SeenreqOptions;

    constructor(options: SeenreqOptions = {}) {
        let Repo = null;
        const normalizers: any[] = [];

        this.globalOptions = options;

        if (!options.repo || options.repo === "default" || options.repo === "memory") {
            Repo = require("./lib/repo/default.js");
        } else {
            const moduleName = `seenreq-repo-${options.repo}`;
            try {
                Repo = require(moduleName);
            } catch (e) {
                console.error(`\nCannot load module ${moduleName}, please run 'npm install ${moduleName}' and retry\n`);
                throw e;
            }
        }

        this.repo = new Repo(options);

        if (!options.normalizer) {
            Normalizers.push(require("./lib/normalizer/default.js"));
        } else {
            let moduleNames = null;
            if (typeof options.normalizer === "string") {
                moduleNames = [options.normalizer];
            } else {
                moduleNames = options.normalizer;
            }

            moduleNames.map(moduleName => {
                moduleName = `seenreq-nmlz-${moduleName}`;
                try {
                    Normalizers.push(require(moduleName));
                } catch (e) {
                    console.error(`Cannot load module ${moduleName}, please run 'npm install ${moduleName}' and retry`);
                }
            });
        }

        this.normalizers = Normalizers.map(ctor => new ctor(options));
    }

    async initialize(): Promise<void> {
        return this.repo.initialize();
    }

    normalize(req: string | RequestOptions, options?: SeenreqOptions): { sign: string; options: SeenreqOptions } {
        // Implement the normalize function as you originally had it
    }

    async exists(
        req: string | RequestOptions | (string | RequestOptions)[],
        options?: SeenreqOptions
    ): Promise<{ sign: string; options: SeenreqOptions }[] | { sign: string; options: SeenreqOptions }> {
        // Implement the exists function as you originally had it
    }

    async dispose(): Promise<void> {
        return this.repo.dispose();
    }
}

export = Seenreq;
