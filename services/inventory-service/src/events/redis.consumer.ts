import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/inventory.service";
import { publishStockUpdated, publishLowStock } from "../events/redis.publisher";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.created",
    "pos.sale.refunded",
    "procurement.order.received"
  );

  sub.on("message", async (channel: string, message: string) => {

    const event = JSON.parse(message);

    if (!event?.eventId || !event?.data) return;

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
            event.data.transactionId
          );

          const stock = await service.getStock(
            item.productId,
            event.data.branchId
          );

          await publishStockUpdated({
            product_id: item.productId,
            current_stock: stock.total_stock,
            stock_value: 0
          });

          if (stock.total_stock <= 10) {
            await publishLowStock({
              product_id: item.productId,
              branch_id: event.data.branchId,
              stock: stock.total_stock
            });
          }

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

          const stock = await service.getStock(
            item.productId,
            event.data.branchId
          );

          await publishStockUpdated({
            product_id: item.productId,
            branch_id: event.data.branchId,
            current_stock: stock.total_stock,
            stock_value: 0
          });

        }
      }

      if (channel === "procurement.order.received") {

        for (const item of event.data.items) {

          await service.createBatch({
            branch_id: event.data.branchId,
            product_id: item.productId,
            quantity: item.quantityReceived,
            cost_per_unit: item.cost
          });

          const stock = await service.getStock(
            item.productId,
            event.data.branchId
          );

          await publishStockUpdated({
            product_id: item.productId,
            branch_id: event.data.branchId,
            current_stock: stock.total_stock,
            stock_value: 0
          });

        }
      }

      await prisma.event_log.create({
        data: { event_id: event.eventId }
      });

    } catch (err: any) {

      await prisma.failed_events.create({
        data: {
          event_id: event.eventId,
          payload: event,
          error: err.message
        }
      });

    }
  });
};