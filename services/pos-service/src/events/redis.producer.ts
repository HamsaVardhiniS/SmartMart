import redis from "../config/redis";

export const publishSaleEvent = async (event: any) => {

  const safeEvent = JSON.parse(
    JSON.stringify(event, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

  await redis.publish("sales", JSON.stringify(safeEvent));
};

export const publishRefundEvent = async (event: any) => {

  const safeEvent = JSON.parse(
    JSON.stringify(event, (_, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  );

  await redis.publish("refunds", JSON.stringify(safeEvent));
};