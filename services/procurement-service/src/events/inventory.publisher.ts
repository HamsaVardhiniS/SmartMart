import redis from "../config/redis";
import { logger } from "../config/logger";

export const publishStockReceived = async (item: any) => {
  try {
    const event = {
      type: "STOCK_RECEIVED",
      data: {
        product_id: item.product_id,
        quantity: item.quantity_received,
        batch_id: item.order_item_id,
      },
    };

    await redis.publish("inventory-events", JSON.stringify(event));

    logger.info(`Published STOCK_RECEIVED for product ${item.product_id}`);
  } catch (error: any) {
    logger.error(`Failed to publish STOCK_RECEIVED: ${error.message}`);
  }
};