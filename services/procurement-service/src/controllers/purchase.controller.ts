import { Request, Response, NextFunction } from "express";
import * as service from "../services/purchase.service";

/* ---------------- LIST ORDERS ---------------- */
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await service.getPurchaseOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

/* ---------------- CREATE ORDER ---------------- */
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { branch_id, supplier_id, expected_delivery_date, invoice_number } = req.body;

    if (!branch_id) {
      return res.status(400).json({ error: "branch_id is required" });
    }

    const order = await service.createPurchaseOrder({
      branch_id,
      supplier_id,
      expected_delivery_date,
      invoice_number
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

/* ---------------- ADD ITEMS ---------------- */
export const addItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = BigInt(req.params.orderId);

    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: "Items array cannot be empty" });
    }

    const items = await service.addOrderItems(orderId, {
      items: req.body.items 
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
};

/* ---------------- RECEIVE GOODS ---------------- */
export const receiveGoods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = BigInt(req.params.itemId);

    if (!req.body.quantity || req.body.quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const item = await service.receiveGoods(itemId, {
      quantity: req.body.quantity 
    });

    res.json(item);
  } catch (err) {
    next(err);
  }
};

/* ---------------- CANCEL ORDER ---------------- */
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = BigInt(req.params.orderId);

    const order = await service.cancelOrder(orderId);

    res.json(order);
  } catch (err) {
    next(err);
  }
};

/* ---------------- SUPPLIER PAYMENT ---------------- */
export const supplierPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { supplier_id, order_id, amount, payment_status } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    const payment = await service.recordSupplierPayment({
      supplier_id,
      order_id,
      amount,
      payment_status
    });

    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};