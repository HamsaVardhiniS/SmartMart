import redis from "../config/redis";
import * as service from "../services/hr.service";

export const startConsumer=()=>{

 const sub=redis.duplicate();

 sub.subscribe("employee.created");

 sub.on("message",async(channel,message)=>{

  const data=JSON.parse(message);

  if(channel==="employee.created"){
   await service.createEmployee(data);
  }

 });
};