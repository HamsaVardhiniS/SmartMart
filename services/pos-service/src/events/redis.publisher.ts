import redis from "../config/redis";
import { createEvent } from "../utils/event.util";

const publish = async (channel: string, event: any) => {
  await redis.publish(channel, JSON.stringify(event));
};

/* SALE CREATED */
export const publishSaleCreated = async (data: any) => {
  const event = createEvent("pos.sale.created.v1", "pos-service", data);
  await publish("pos.sale.created", event);
};

/* PAYMENT COMPLETED */
export const publishPaymentCompleted = async (data: any) => {
  const event = createEvent("pos.payment.completed.v1", "pos-service", data);
  await publish("pos.payment.completed", event);
};

/* SALE CANCELLED */
export const publishSaleCancelled = async (data: any) => {
  const event = createEvent("pos.sale.cancelled.v1", "pos-service", data);
  await publish("pos.sale.cancelled", event);
};

/* REFUND */
export const publishRefund = async (data: any) => {
  const event = createEvent("pos.sale.refunded.v1", "pos-service", data);
  await publish("pos.sale.refunded", event);
};