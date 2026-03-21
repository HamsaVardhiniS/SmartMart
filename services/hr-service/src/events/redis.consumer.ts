import redis from "../config/redis";
import { logger } from "../config/logger";

export const startConsumer = () => {

  const sub = redis.duplicate();

  sub.subscribe("employee.created", (err) => {
    if (err) {
      logger.error(`Subscription failed: ${err.message}`);
    }
  });

  sub.on("message", async (channel, message) => {
    try {
      const data = JSON.parse(message);

      if (channel === "employee.created") {
        logger.info(`Employee created event received: ${JSON.stringify(data)}`);
      }

    } catch (err: any) {
      logger.error(`Redis consumer error: ${err.message}`);
    }
  });
};