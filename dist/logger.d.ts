export declare const logOptions: {
    type: "hidden" | "json" | "pretty";
    name: string;
    hideLogPositionForProduction: boolean;
    prettyLogTemplate: string;
    prettyLogStyles: {
        logLevelName: {
            SILLY: string[];
            TRACE: string[];
            DEBUG: string[];
            INFO: string[];
            WARN: string[];
            ERROR: string[];
            FATAL: string[];
        };
        name: string[];
        dateIsoStr: string;
        filePathWithLine: string;
        nameWithDelimiterPrefix: string[];
        nameWithDelimiterSuffix: string[];
        errorName: string[];
        fileName: string[];
    };
    minLevel: number;
};
//# sourceMappingURL=logger.d.ts.map