import redis from "../config/redis";
import prisma from "../config/db";

export const startConsumer = async () => {

  const sub = redis.duplicate();

  await sub.subscribe("hr.employee.reset_password");

  sub.on("message", async (channel: string, message: string) => {

    const event = JSON.parse(message);

    if (!event?.eventId || !event?.data) return;

    const exists = await prisma.event_log.findUnique({
      where:{event_id:event.eventId}
    });

    if (exists) return;

    try {

      if (channel === "hr.employee.reset_password") {

        await prisma.password_resets.create({
          data: {
            employee_id: event.data.employee_id,
            reset_token: Math.random().toString(36).substring(2),
            expiry_time: new Date(Date.now() + 15 * 60 * 1000)
          }
        });

      }

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