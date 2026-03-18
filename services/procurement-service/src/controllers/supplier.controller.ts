import { Request, Response } from "express";
import * as service from "../services/supplier.service";

export const createSupplier = async (req: Request, res: Response) => {
  const supplier = await service.createSupplier(req.body);
  res.json(supplier);
};

export const getSuppliers = async (req: Request, res: Response) => {
  const suppliers = await service.getSuppliers();
  res.json(suppliers);
};

export const getSupplier = async (req: Request, res: Response) => {
  const supplier = await service.getSupplierById(Number(req.params.id));
  res.json(supplier);
};

export const updateSupplier = async (req: Request, res: Response) => {
  const supplier = await service.updateSupplier(
    Number(req.params.id),
    req.body
  );
  res.json(supplier);
};

export const deactivateSupplier = async (req: Request, res: Response) => {
  const supplier = await service.deactivateSupplier(Number(req.params.id));
  res.json(supplier);
};