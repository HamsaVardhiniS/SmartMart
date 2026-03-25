import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/admin.service";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.cancelled",
    "inventory.stock.updated",
    "admin.role.updated"
  );

  sub.on("message", async (_, message) => {

    const event = JSON.parse(message);

    try {
      await service.logAction({
        action:event.eventType,
        metadata:event.data
      });
    } catch {}
  });
};