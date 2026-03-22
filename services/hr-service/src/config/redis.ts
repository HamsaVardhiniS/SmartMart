import Redis from "ioredis";
import { logger } from "./logger";

if (!process.env.REDIS_HOST) {
  throw new Error("REDIS_HOST is not defined in environment variables");
}

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis reconnect attempt #${times}, delay: ${delay}ms`);
    return delay;
  },
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("ready", () => {
  logger.info("Redis ready");
});

redis.on("error", (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

export default redis;