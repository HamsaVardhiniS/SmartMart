import redis from "../config/redis";
import { createEvent } from "../utils/event.util";

export const publishStockUpdated = async (data:any) => {
  const event = createEvent(
    "inventory.stock.updated.v1",
    "inventory-service",
    data
  );

  await redis.publish("inventory.stock.updated", JSON.stringify(event));
};

export const publishLowStock = async (data:any) => {
  const event = createEvent(
    "inventory.stock.low.v1",
    "inventory-service",
    data
  );

  await redis.publish("inventory.stock.low", JSON.stringify(event));
};