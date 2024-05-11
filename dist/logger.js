export const logOptions = {
    type: "pretty",
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
//# sourceMappingURL=logger.js.map