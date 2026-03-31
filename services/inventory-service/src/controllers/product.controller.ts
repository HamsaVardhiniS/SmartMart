import { Request, Response, NextFunction } from "express";
import * as service from "../services/inventory.service";
import { productSchema } from "../utils/validation";

/* PRODUCT */

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = productSchema.parse(req.body);
    const data = await service.createProduct(parsed);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const data = await service.getProducts(page, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = await service.updateProduct(id, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* STOCK */

export const productStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = Number(req.params.id);
    const branch = Number(req.query.branch);
    const data = await service.getStock(product, branch);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const stock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = Number(req.params.product);
    const b = Number(req.params.branch);
    const data = await service.getStock(p, b);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* BRAND */

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.createBrand(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const getBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.getBrands());
  } catch (err) {
    next(err);
  }
};

/* CATEGORY */

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.createCategory(req.body));
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.getCategories());
  } catch (err) {
    next(err);
  }
};

/* SUBCATEGORY */

export const createSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.createSubcategory(req.body));
  } catch (err) {
    next(err);
  }
};

export const getSubcategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.getSubcategories());
  } catch (err) {
    next(err);
  }
};

/* BATCH */

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.createBatch(req.body));
  } catch (err) {
    next(err);
  }
};

/* SALES */

export const processSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id, branch_id, quantity, reference_id} = req.body;

    const data = await service.processSale(
      product_id,
      branch_id,
      quantity,
      reference_id
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/* ADJUST */

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.adjustStock(req.body));
  } catch (err) {
    next(err);
  }
};

/* REPORTS */

export const lowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.lowStock());
  } catch (err) {
    next(err);
  }
};

export const nearExpiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.nearExpiry());
  } catch (err) {
    next(err);
  }
};

export const deadStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.deadStock());
  } catch (err) {
    next(err);
  }
};

export const stockValuation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.stockValuation());
  } catch (err) {
    next(err);
  }
};

/* CONFIG */

export const updateReorder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const reorder = req.body.reorder_level;
    res.json(await service.updateReorderLevel(id, reorder));
  } catch (err) {
    next(err);
  }
};

export const updateTax = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const tax = req.body.tax_percentage;
    res.json(await service.updateTaxRate(id, tax));
  } catch (err) {
    next(err);
  }
};