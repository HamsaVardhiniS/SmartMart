import { Request, Response } from "express";
import * as service from "../services/admin.service";

/* ROLE */
export const createRole = async(req:Request,res:Response)=>{
 res.json(await service.createRole(req.body));
};

export const assignPermission = async(req:Request,res:Response)=>{
 const {role_id,permission_id}=req.body;
 res.json(await service.assignPermission(role_id,permission_id));
};

/* USER */
export const createUser = async(req:Request,res:Response)=>{
 res.json(await service.createUser(req.body));
};

/* CONFIG */
export const setConfig = async(req:Request,res:Response)=>{
 res.json(await service.setConfig(req.body));
};

export const getConfig = async(req:Request,res:Response)=>{
 res.json(await service.getConfig());
};

/* FEATURE */
export const toggleFeature = async(req:Request,res:Response)=>{
 res.json(await service.toggleFeature(req.body));
};

/* APPROVAL */
export const createApproval = async(req:Request,res:Response)=>{
 res.json(await service.createApproval(req.body));
};

export const approveRequest = async(req:Request,res:Response)=>{
 const id=Number(req.params.id);
 const approver=req.body.approved_by;
 res.json(await service.approveRequest(id,approver));
};

/* AUDIT */
export const getLogs = async(req:Request,res:Response)=>{
 res.json(await service.getLogs());
};

/* RESET */
export const resetPassword = async(req:Request,res:Response)=>{
 await service.resetEmployeePassword(req.body.employee_id);
 res.json({message:"reset sent"});
};

/* DEPARTMENT */
export const createDepartment = async(req:Request,res:Response)=>{
 await service.createDepartment(req.body);
 res.json({message:"event sent"});
};