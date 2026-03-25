import redis from "../config/redis";
import prisma from "../config/db";
import * as service from "../services/admin.service";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.sale.cancelled",
    "pos.sale.created",
    "inventory.stock.updated",
    "procurement.order.received",
    "hr.payroll.generated",
    "admin.role.updated"
  );

  sub.on("message", async (channel: string, message: string) => {

    const event = JSON.parse(message);
  
    const exists = await prisma.event_log.findUnique({
      where: { event_id: event.eventId }
    });
  
    if (exists) return;
  
    try {
  
      await service.logAction({
        action: event.eventType,
        metadata: event.data
      });
  
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