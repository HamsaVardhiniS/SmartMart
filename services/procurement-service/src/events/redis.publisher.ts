import redis from "../config/redis";
import { createEvent } from "../utils/event.util";

export const publishOrderReceived = async (data:any) => {
  const event = createEvent(
    "procurement.order.received.v1",
    "procurement-service",
    data
  );

  await redis.publish("procurement.order.received", JSON.stringify(event));
};