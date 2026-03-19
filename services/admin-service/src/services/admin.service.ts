import prisma from "../config/db";
import redis from "../config/redis";
import { logger } from "../config/logger";

/* ROLE */
export const createRole = async(data:any)=>{
 return prisma.role.create({data});
};

export const assignPermission = async(role:number,permission:number)=>{
 const res = await prisma.rolePermission.create({
  data:{role_id:role,permission_id:permission}
 });

 await redis.publish("role.updated",JSON.stringify({role}));

 return res;
};

/* USER */
export const createUser = async(data:any)=>{
 return prisma.adminUser.create({data});
};

/* CONFIG */
export const setConfig = async(data:any)=>{
 const res = await prisma.systemConfig.upsert({
  where:{config_key:data.config_key},
  update:{config_value:data.config_value},
  create:data
 });

 await redis.publish("config.updated",JSON.stringify(data));
 return res;
};

export const getConfig = async()=>{
 return prisma.systemConfig.findMany();
};

/* FEATURE */
export const toggleFeature = async(data:any)=>{
 const res = await prisma.featureFlag.upsert({
  where:{feature_name:data.feature_name},
  update:{is_enabled:data.is_enabled},
  create:data
 });

 await redis.publish("feature.updated",JSON.stringify(data));
 return res;
};

/* APPROVAL */
export const createApproval = async(data:any)=>{
 return prisma.approvalRequest.create({data});
};

export const approveRequest = async(id:number,approved_by:number)=>{
 return prisma.approvalRequest.update({
  where:{request_id:id},
  data:{status:"APPROVED",approved_by}
 });
};

/* AUDIT */
export const logAction = async(data:any)=>{
 return prisma.auditLog.create({data});
};

export const getLogs = async()=>{
 return prisma.auditLog.findMany({
  orderBy:{timestamp:"desc"},
  take:100
 });
};

/* RESET */
export const resetEmployeePassword = async(employee_id:number)=>{
 await redis.publish("employee.reset.password",JSON.stringify({employee_id}));
 logger.info("Password reset event",{employee_id});
};

/* DEPARTMENT */
export const createDepartment = async(data:any)=>{
 await redis.publish("department.create",JSON.stringify(data));
 logger.info("Department create event",data);
};