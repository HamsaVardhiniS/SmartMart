import redis from "../config/redis";
import prisma from "../config/db";

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
    let event: any;

    try {
      event = JSON.parse(message);

      if (!event?.eventId || !event?.eventType) {
        throw new Error("Invalid event format");
      }

      const exists = await prisma.event_log.findUnique({
        where: { event_id: event.eventId }
      });

      if (exists) return;

      await prisma.$transaction([
        prisma.auditLog.create({
          data: {
            action: event.eventType,
            metadata: event.data ?? {}
          }
        }),
        prisma.event_log.create({
          data: { event_id: event.eventId }
        })
      ]);

    } catch (err: any) {
      try {
        await prisma.failed_events.create({
          data: {
            event_id: event?.eventId ?? "unknown",
            payload: event ?? {},
            error: err.message
          }
        });
      } catch (_) {}
    }
  });

  setInterval(async () => {
    try {
      const failed = await prisma.failed_events.findMany({ take: 10 });

      for (const event of failed) {
        try {
          await prisma.auditLog.create({
            data: {
              action: "retry",
              metadata: event.payload ?? {}
            }
          });

          await prisma.failed_events.delete({
            where: { id: event.id }
          });

        } catch (_) {}
      }

    } catch (_) {}
  }, 5000);
};