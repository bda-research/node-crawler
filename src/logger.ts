import { createLogger, transports, format } from "winston";
const logger = createLogger({
    transports: [
        new transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug",
            format: format.combine(
                format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss.SSS",
                }),
                format.label({ label: "[Crawler]" }),
                format.splat(),
                format.colorize({ all: true }),
                format.printf(info => {
                    if (typeof info.message === "object") {
                        info.message = JSON.stringify(info.message, null, 4);
                    }
                    return `${info["timestamp"]} ${info.label} ${info.level}: ${info.message}`;
                })
            ),
        }),
    ],
    exitOnError: true,
});

export default logger;
