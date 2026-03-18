import { Request, Response } from "express";
import * as service from "../services/analytics.service";

/* SALES */

export const revenue = async(req:Request,res:Response)=>{
 res.json(await service.getRevenue());
};

export const productRanking = async(req:Request,res:Response)=>{
 res.json(await service.productRanking());
};

/* INVENTORY */

export const inventorySummary = async(req:Request,res:Response)=>{
 res.json(await service.inventorySummary());
};

/* HR */

export const payrollSummary = async(req:Request,res:Response)=>{
 res.json(await service.payrollSummary());
};

/* SUPPLIER */

export const supplierSummary = async(req:Request,res:Response)=>{
 res.json(await service.supplierSummary());
};