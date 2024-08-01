import { Logger } from "tslog";

const logLevelsByEnv: Record<string, number> = {
    "debug": 0,
    "production": 3,
    "test": 7,
};

export const logOptions = {
    type: "pretty" as "json" | "pretty" | "hidden",
    name: "Crawler",
    hideLogPositionForProduction: true,
    prettyLogTemplate: "{{name}} {{logLevelName}} ",
    prettyLogStyles: {
        logLevelName: {
            SILLY: ["bold", "white"],
            TRACE: ["bold", "whiteBright"],
            DEBUG: ["bold", "green"],
            INFO: ["bold", "blue"],
            WARN: ["bold", "yellow"],
            ERROR: ["bold", "red"],
            FATAL: ["bold", "redBright"],
        },
        name: ["bold", "green"],
        dateIsoStr: "white",
        filePathWithLine: "white",
        nameWithDelimiterPrefix: ["white", "bold"],
        nameWithDelimiterSuffix: ["white", "bold"],
        errorName: ["bold", "bgRedBright", "whiteBright"],
        fileName: ["yellow"],
    },
    minLevel: 0,
};

logOptions.minLevel = process.env.NODE_ENV ? logLevelsByEnv[process.env.NODE_ENV] : 3;

export const getLogger = () => new Logger(logOptions);