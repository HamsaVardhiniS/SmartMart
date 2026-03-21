import { Request, Response, NextFunction } from "express";
import * as service from "../services/analytics.service";

/* SALES */

export const revenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getRevenue();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const productRanking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.productRanking();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* INVENTORY */

export const inventorySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.inventorySummary();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* HR */

export const payrollSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.payrollSummary();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* SUPPLIER */

export const supplierSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.supplierSummary();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
