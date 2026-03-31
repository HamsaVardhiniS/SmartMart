import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/analytics.service";

export const startConsumer = async () => {
  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.created",
    "pos.sale.refunded",
    "inventory.stock.updated",
    "procurement.order.received",
    "hr.payroll.generated"
  );

  sub.on("message", async (channel: string, message: string) => {
    let event;

    try {
      event = JSON.parse(message);
    } catch {
      return;
    }

    if (!event?.eventId || !event?.data || !event?.timestamp) {
      return;
    }

    try {
      await prisma.$transaction(async (tx) => {

        // ✅ Idempotency (FIRST)
        try {
          await tx.event_log.create({
            data: { event_id: event.eventId }
          });
        } catch {
          return; // already processed
        }

        /* =========================
           VALIDATION LAYER (CRITICAL)
        ========================== */

        // POS SALE
        if (channel === "pos.sale.created") {
          if (
            event.data.netAmount === undefined ||
            event.data.taxAmount === undefined ||
            event.data.branchId === undefined ||
            !Array.isArray(event.data.items)
          ) {
            throw new Error("Invalid POS sale event schema");
          }
        }

        // REFUND
        if (channel === "pos.sale.refunded") {
          if (
            event.data.netAmount === undefined ||
            event.data.taxAmount === undefined
          ) {
            throw new Error("Invalid refund event schema");
          }
        }

        // INVENTORY (THIS FIXES YOUR CURRENT BUG)
        if (channel === "inventory.stock.updated") {
          if (
            event.data.product_id === undefined ||
            event.data.branch_id === undefined ||
            event.data.current_stock === undefined ||
            event.data.stock_value === undefined
          ) {
            throw new Error("Invalid inventory event schema");
          }
        }

        // PROCUREMENT
        if (channel === "procurement.order.received") {
          if (
            event.data.branchId === undefined ||
            !Array.isArray(event.data.items)
          ) {
            throw new Error("Invalid procurement event schema");
          }
        }

        // PAYROLL
        if (channel === "hr.payroll.generated") {
          if (
            event.data.month === undefined ||
            event.data.year === undefined ||
            event.data.amount === undefined
          ) {
            throw new Error("Invalid payroll event schema");
          }
        }

        /* =========================
           PROCESSING LAYER
        ========================== */

        // POS SALE
        if (channel === "pos.sale.created") {
          await service.updateSalesSummary({
            date: new Date(event.timestamp),
            revenue: event.data.netAmount,
            tax: event.data.taxAmount
          });

          for (const item of event.data.items) {
            await service.updateProductSales({
              product_id: item.productId,
              branch_id: event.data.branchId,
              quantity: item.quantity,
              revenue: item.price * item.quantity
            });
          }
        }

        // REFUND
        if (channel === "pos.sale.refunded") {
          await service.updateSalesSummary({
            date: new Date(event.timestamp),
            revenue: -event.data.netAmount,
            tax: -event.data.taxAmount
          });
        }

        // INVENTORY
        if (channel === "inventory.stock.updated") {
          await service.updateInventory({
            product_id: event.data.product_id,
            branch_id: event.data.branch_id,
            current_stock: event.data.current_stock,
            stock_value: event.data.stock_value
          });
        }

        // PROCUREMENT
        if (channel === "procurement.order.received") {
          for (const item of event.data.items) {
            await service.updateSupplier({
              supplier_id: event.data.supplierId || 0,
              branch_id: event.data.branchId,
              amount: item.cost * item.quantityReceived
            });
          }
        }

        // PAYROLL
        if (channel === "hr.payroll.generated") {
          await service.updatePayroll(event.data);
        }
      });

    } catch (err: any) {
      // ✅ Now ALL invalid events will land here
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