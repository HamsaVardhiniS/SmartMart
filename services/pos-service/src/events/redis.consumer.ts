import redis from "../config/redis";
import { logger } from "../config/logger";

export const startConsumer = async () => {
  try {
    if (redis.status !== "ready") {
      await redis.connect();
    }

    await redis.subscribe("pos.sales", "pos.refunds");

    logger.info("Redis consumer subscribed");

    redis.on("message", (channel, message) => {
      const data = JSON.parse(message);

      logger.info(`Event received from ${channel}`);

      if (channel === "pos.sales") {
        // handle sale event
      }

      if (channel === "pos.refunds") {
        // handle refund event
      }
    });

  } catch (err: any) {
    logger.error(`Consumer error: ${err.message}`);
  }
};