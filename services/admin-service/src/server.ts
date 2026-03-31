import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startConsumer } from "./events/redis.consumer";
import { logger } from "./config/logger";
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "admin-service";

const startServer = async () => {
  try {
    startConsumer();

    app.listen(PORT, () => {
      logger.info(`${SERVICE_NAME} running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error(`Failed to start ${SERVICE_NAME}: ${error.message}`);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", () => {
  logger.info(`${SERVICE_NAME} shutting down...`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info(`${SERVICE_NAME} terminated`);
  process.exit(0);
});