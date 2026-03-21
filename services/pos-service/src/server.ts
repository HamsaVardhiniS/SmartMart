import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startConsumer } from "./events/redis.consumer";
import { logger } from "./config/logger";

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "pos-service";

const startServer = async () => {
  try {
    /* 1. Start Redis Consumer FIRST */
    await startConsumer();

    logger.info("Redis consumer started");

    /* 2. Start HTTP Server */
    app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} running on port ${PORT}`);
    });

  } catch (error: any) {
    logger.error(`Failed to start ${SERVICE_NAME}: ${error.message}`);
    process.exit(1);
  }
};

startServer();

/* Graceful shutdown */

process.on("SIGINT", () => {
  logger.info(`${SERVICE_NAME} shutting down...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info(`${SERVICE_NAME} terminated`);
  process.exit(0);
});