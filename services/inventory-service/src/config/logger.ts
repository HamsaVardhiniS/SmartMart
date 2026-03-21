import winston from "winston";

const serviceName = process.env.SERVICE_NAME || "unknown-service";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] [${serviceName}] ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});