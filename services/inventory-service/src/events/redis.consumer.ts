import redis from "../config/redis";
import * as service from "../services/inventory.service";

export const startConsumer = () => {

  const sub = redis.duplicate();

  sub.subscribe("sale.completed");
  sub.subscribe("purchase.received");
  sub.subscribe("refund.completed");

  sub.on("message", async (channel, message) => {
    try {
      const data = JSON.parse(message);

      if (channel === "sale.completed") {
        await service.processSale(
          data.product_id,
          data.branch_id,
          data.quantity,
          data.reference_id
        );
      }

      if (channel === "purchase.received") {
        await service.createBatch(data);
      }

      if (channel === "refund.completed") {
        await service.adjustStock({
          branch_id: data.branch_id,
          product_id: data.product_id,
          batch_id: data.batch_id,
          quantity: data.quantity,
          movement_type: "REFUND"
        });
      }

    } catch (err: any) {
      console.error("Inventory consumer error:", err.message);
    }
  });
};