import Redis from "ioredis";
import { logger } from "./logger";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,

  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnect attempt #${times}, delay: ${delay}ms`);
    return delay || 50;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (err) => {
  logger.error(`Redis error: ${err.message}`);
});

export default redis;