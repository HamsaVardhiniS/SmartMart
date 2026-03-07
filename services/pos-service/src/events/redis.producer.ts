import redis from "../config/redis";

export const publishSaleEvent = async (data: any) => {
  await redis.publish("sale_completed", JSON.stringify(data));
};

export const publishRefundEvent = async (data: any) => {
  await redis.publish("sale_refunded", JSON.stringify(data));
};