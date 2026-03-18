import { Request, Response } from "express";
import * as service from "../services/purchase.service";
import { serializeBigInt } from "../utils/serializeBigInt";

export const createOrder = async (req: Request, res: Response) => {
  const order = await service.createPurchaseOrder(req.body);
  res.json(serializeBigInt(order));
};

export const addItems = async (req: Request, res: Response) => {
  const items = await service.addOrderItems(
    BigInt(req.params.orderId),
    req.body.items
  );
  res.json(items);
};

export const receiveGoods = async (req: Request, res: Response) => {
  const item = await service.receiveGoods(
    BigInt(req.params.itemId),
    req.body.quantity
  );
  res.json(item);
};

export const cancelOrder = async (req: Request, res: Response) => {
  const order = await service.cancelOrder(BigInt(req.params.orderId));
  res.json(order);
};

export const supplierPayment = async (req: Request, res: Response) => {
  const payment = await service.recordSupplierPayment(req.body);
  res.json(payment);
};