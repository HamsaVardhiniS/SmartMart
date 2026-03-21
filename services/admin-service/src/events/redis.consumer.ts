import redis from "../config/redis";
import * as service from "../services/admin.service";

export const startConsumer=()=>{

 const sub=redis.duplicate();

sub.subscribe("audit.log", (err) => {
  if (err) {
    console.error("Subscription failed:", err.message);
  }
});

 sub.on("message", async (channel, message) => {
  try {
    const data = JSON.parse(message);

    if (channel === "audit.log") {
      await service.logAction(data);
    }
  } catch (err: any) {
    console.error("Redis consumer error:", err.message);
  }
});
};