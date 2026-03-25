import redis from "../config/redis";
import prisma from "../config/db";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe(
    "pos.payment.completed",
    "pos.payment.failed"
  );

  sub.on("message", async (channel: string, message: string) => {

    const event = JSON.parse(message);

    if (!event?.eventId || !event?.data) return;

    const exists = await prisma.event_log.findUnique({
      where: { event_id: event.eventId }
    });

    if (exists) return;

    try {

      if (channel === "pos.payment.completed") {
        // future handling
      }

      if (channel === "pos.payment.failed") {
        // future handling
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