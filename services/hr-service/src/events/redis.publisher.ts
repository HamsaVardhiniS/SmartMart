import redis from "../config/redis";
import { createEvent } from "../utils/event.util";

export const publishPayroll = async (data:any) => {
  const event = createEvent(
    "hr.payroll.generated.v1",
    "hr-service",
    data
  );

  await redis.publish("hr.payroll.generated", JSON.stringify(event));
};