import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export const publishStockReceived = async (item: any) => {

  const event = {
    type: "STOCK_RECEIVED",
    data: {
      product_id: item.product_id,
      quantity: item.quantity_received,
      batch_id: item.order_item_id
    }
  };

  await redis.publish("inventory-events", JSON.stringify(event));
};