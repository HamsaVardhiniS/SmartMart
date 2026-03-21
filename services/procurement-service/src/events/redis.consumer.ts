import Redis from "ioredis";
import { logger } from "../config/logger";

const subscriber = new Redis(process.env.REDIS_URL!);

export const startConsumer = async () => {
  try {
    await subscriber.subscribe("inventory-events");

    logger.info("Subscribed to inventory-events");

    subscriber.on("message", async (channel, message) => {
      try {
        const event = JSON.parse(message);

        switch (event.type) {
          case "STOCK_RECEIVED":
            logger.info(`Stock received event consumed: ${message}`);
            break;

          default:
            logger.warn(`Unhandled event type: ${event.type}`);
        }
      } catch (err: any) {
        logger.error(`Error processing message: ${err.message}`);
      }
    });
  } catch (error: any) {
    logger.error(`Redis consumer failed: ${error.message}`);
  }
};