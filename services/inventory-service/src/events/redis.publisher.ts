import redis from "../config/redis";
import { createEvent } from "../utils/event.util";

/* SAFE JSON STRINGIFY (BIGINT FIX) */
const safeStringify = (data: any) =>
  JSON.stringify(data, (_, v) =>
    typeof v === "bigint" ? v.toString() : v
  );

/* GENERIC PUBLISH FUNCTION */
const publish = async (channel: string, event: any) => {
  await redis.publish(channel, safeStringify(event));
};

/* STOCK UPDATED */
export const publishStockUpdated = async (data: any) => {
  const event = createEvent(
    "inventory.stock.updated.v1",
    "inventory-service",
    data
  );

  await publish("inventory.stock.updated", event);
};

/* LOW STOCK */
export const publishLowStock = async (data: any) => {
  const event = createEvent(
    "inventory.stock.low.v1",
    "inventory-service",
    data
  );

  await publish("inventory.stock.low", event);
};