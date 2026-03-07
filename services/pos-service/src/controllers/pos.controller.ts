import { Request, Response } from "express";
import * as service from "../services/pos.service";

/* SALES */

export const createSale = async (req: Request, res: Response) => {
  const data = await service.createSale(req.body);
  res.json(data);
};

export const getSale = async (req: Request, res: Response) => {
  const sale = await service.getSale(Number(req.params.id));
  res.json(sale);
};

export const cancelSale = async (req: Request, res: Response) => {
  const sale = await service.cancelSale(Number(req.params.id));
  res.json(sale);
};

/* PAYMENTS */

export const addPayment = async (req: Request, res: Response) => {
  const payment = await service.addPayment(req.body);
  res.json(payment);
};

/* REFUND */

export const processRefund = async (req: Request, res: Response) => {
  const refund = await service.processRefund(req.body);
  res.json(refund);
};

/* CUSTOMERS */

export const createCustomer = async (req: Request, res: Response) => {
  const customer = await service.createCustomer(req.body);
  res.json(customer);
};

export const getCustomer = async (req: Request, res: Response) => {
  const customer = await service.getCustomer(Number(req.params.id));
  res.json(customer);
};

export const updateCustomer = async (req: Request, res: Response) => {
  const customer = await service.updateCustomer(
    Number(req.params.id),
    req.body
  );
  res.json(customer);
};

export const customerSummary = async (req: Request, res: Response) => {
  const data = await service.customerLifetimeSummary(Number(req.params.id));
  res.json(data);
};

export const addFeedback = async (req: Request, res: Response) => {
  const feedback = await service.addFeedback(req.body);
  res.json(feedback);
};

export const customerHistory = async (req: Request, res: Response) => {
  const history = await service.customerHistory(Number(req.params.id));
  res.json(history);
};