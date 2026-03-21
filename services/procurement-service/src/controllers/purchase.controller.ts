import { Request, Response, NextFunction } from "express";
import * as service from "../services/purchase.service";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await service.createPurchaseOrder(req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const addItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await service.addOrderItems(
      BigInt(req.params.orderId),
      req.body.items
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
};

export const receiveGoods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await service.receiveGoods(
      BigInt(req.params.itemId),
      req.body.quantity
    );
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await service.cancelOrder(BigInt(req.params.orderId));
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const supplierPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await service.recordSupplierPayment(req.body);
    res.json(payment);
  } catch (err) {
    next(err);
  }
};