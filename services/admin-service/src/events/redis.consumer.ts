import redis from "../config/redis";
import * as service from "../services/admin.service";

export const startConsumer=()=>{

 const sub=redis.duplicate();

 sub.subscribe("audit.log");

 sub.on("message",async(channel,message)=>{

  const data=JSON.parse(message);

  if(channel==="audit.log"){
   await service.logAction(data);
  }

 });
};