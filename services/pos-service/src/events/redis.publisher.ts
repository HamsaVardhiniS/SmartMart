import redis from "../config/redis";
import { logger } from "../config/logger";
import { randomUUID } from "crypto";

export const CHANNELS = {
  SALES: "pos.sales",
  REFUNDS: "pos.refunds"
};

const sanitize = (event: any) =>
  JSON.parse(
    JSON.stringify(event, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

const ensureConnection = async () => {
  if (redis.status !== "ready") {
    await redis.connect();
  }
};

/* SALE EVENT */

export const publishSaleEvent = async (event: any) => {
  try {
    await ensureConnection();

    const payload = {
      event_id: randomUUID(),
      event_type: "SALE_CREATED",
      service: process.env.SERVICE_NAME || "pos-service",
      timestamp: new Date().toISOString(),
      data: sanitize(event)
    };

    const subscribers = await redis.publish(
      CHANNELS.SALES,
      JSON.stringify(payload)
    );

    if (subscribers === 0) {
      logger.warn("No subscribers for SALE_CREATED event");
    }

  } catch (err: any) {
    logger.error(`Failed to publish SALE event: ${err.message}`);
  }
};

/* REFUND EVENT */

export const publishRefundEvent = async (event: any) => {
  try {
    await ensureConnection();

    const payload = {
      event_id: randomUUID(),
      event_type: "REFUND_PROCESSED",
      service: process.env.SERVICE_NAME || "pos-service",
      timestamp: new Date().toISOString(),
      data: sanitize(event)
    };

    const subscribers = await redis.publish(
      CHANNELS.REFUNDS,
      JSON.stringify(payload)
    );

    if (subscribers === 0) {
      logger.warn("No subscribers for REFUND event");
    }

  } catch (err: any) {
    logger.error(`Failed to publish REFUND event: ${err.message}`);
  }
};