import redis from "../config/redis";
import prisma from "../config/db";

export const startConsumer = async () => {
  const sub = redis.duplicate();

  await sub.subscribe("inventory.stock.low");

  sub.on("message", async (_, message) => {
    const event = JSON.parse(message);

    const exists = await prisma.event_log.findUnique({
      where: { event_id: event.eventId }
    });

    if (exists) return;

    try {
      // trigger reorder logic

      await prisma.event_log.create({
        data:{event_id:event.eventId}
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