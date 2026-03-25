import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/inventory.service";

export const startConsumer = async () => {
  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.created",
    "pos.sale.refunded",
    "procurement.order.received"
  );

  sub.on("message", async (channel, message) => {

    const event = JSON.parse(message);

    const exists = await prisma.event_log.findUnique({
      where: { event_id: event.eventId }
    });

    if (exists) return;

    try {

      if (channel === "pos.sale.created") {
        for (const item of event.data.items) {
          await service.processSale(
            item.productId,
            event.data.branchId,
            item.quantity,
            event.data.transactionId,
            item.batchId
          );
        }
      }

      if (channel === "pos.sale.refunded") {
        for (const item of event.data.items) {
          await service.adjustStock({
            branch_id: event.data.branchId,
            product_id: item.productId,
            batch_id: item.batchId,
            quantity: item.quantity,
            movement_type: "REFUND"
          });
        }
      }

      if (channel === "procurement.order.received") {
        await service.createBatch(event.data);
      }

      await prisma.event_log.create({
        data: { event_id: event.eventId }
      });

    } catch (err:any) {
      await prisma.failed_events.create({
        data:{
          event_id:event.eventId,
          payload:event,
          error:err.message
        }
      });
    }
  });
};