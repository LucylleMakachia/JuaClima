import { createLogger, transports, format } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.colorize(),
    // Enhanced printf to log metadata if provided
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : "";
      return `${timestamp} ${level}: ${message} ${metaString}`;
    })
  ),
  transports: [new transports.Console()],
});

// Optional: Change log level dynamically based on environment (uncomment if desired)
// logger.level = process.env.NODE_ENV === "production" ? "warn" : "debug";

export default logger;
