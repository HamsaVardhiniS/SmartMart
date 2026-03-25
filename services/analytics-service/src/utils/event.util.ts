import { randomUUID } from "crypto";

export const createEvent = (eventType: string, source: string, data: any) => {
  return {
    eventId: randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    source,
    data
  };
};