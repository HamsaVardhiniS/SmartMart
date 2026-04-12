import prisma from "../config/db";
import { logger } from "../config/logger";
import { Prisma } from "@prisma/client";
import { serializeBigInt } from "../utils/bigintSerializer";

/* PRODUCT MANAGEMENT */

export const createProduct = async (data: any) => {
  // Auto-generate SKU if not provided
  if (!data.sku) {
    data.sku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  const result = await prisma.product.create({ data });
  return serializeBigInt(result);
};

export const getProducts = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const result = await prisma.product.findMany({
    skip,
    take: limit,
    include: {
      brand: true,
      category: true,
      subcategory: true,
    },
  });

  return serializeBigInt(result);
};

export const updateProduct = async (id: number, data: any) => {
  const result = await prisma.product.update({
    where: { product_id: id },
    data,
  });

  return serializeBigInt(result);
};

export const updateReorderLevel = async (id: number, reorder: number) => {
  const result = await prisma.product.update({
    where: { product_id: id },
    data: { reorder_level: reorder },
  });

  return serializeBigInt(result);
};

export const updateTaxRate = async (id: number, tax: number) => {
  const result = await prisma.product.update({
    where: { product_id: id },
    data: { tax_percentage: tax },
  });

  return serializeBigInt(result);
};

/* BRAND */

export const createBrand = async (data: any) => {
  const result = await prisma.brand.create({ data });
  return serializeBigInt(result);
};

export const getBrands = async () => {
  const result = await prisma.brand.findMany();
  return serializeBigInt(result);
};

/* CATEGORY */

export const createCategory = async (data: any) => {
  const result = await prisma.productCategory.create({ data });
  return serializeBigInt(result);
};

export const getCategories = async () => {
  const result = await prisma.productCategory.findMany({
    include: { subcategories: true },
  });
  return serializeBigInt(result);
};

/* SUBCATEGORY */

export const createSubcategory = async (data: any) => {
  const result = await prisma.productSubcategory.create({ data });
  return serializeBigInt(result);
};

export const getSubcategories = async () => {
  const result = await prisma.productSubcategory.findMany();
  return serializeBigInt(result);
};

/* INVENTORY BATCH */

export const createBatch = async (data: any) => {
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const batch = await tx.inventoryBatch.create({ data });

      logger.info("Inventory batch created", {
        product_id: data.product_id,
        branch_id: data.branch_id,
        quantity: data.quantity,
      });

      await tx.stockMovement.create({
        data: {
          branch_id: data.branch_id,
          product_id: data.product_id,
          batch_id: batch.batch_id,
          movement_type: "PURCHASE",
          quantity: data.quantity,
        },
      });

      return batch;
    }
  );

  return serializeBigInt(result);
};

/* MANUAL ADJUSTMENT */

export const adjustStock = async (data: any) => {
  const result = await prisma.stockMovement.create({
    data: {
      ...data,
      movement_type: data.movement_type || "ADJUSTMENT",
    },
  });

  return serializeBigInt(result);
};

/* STOCK */

export const getStock = async (product: number, branch: number) => {
  const batches = await prisma.inventoryBatch.findMany({
    where: {
      product_id: product,
      branch_id: branch,
    },
  });

  const total = batches.reduce(
    (sum: number, b: any) => sum + Number(b.quantity),
    0
  );

  return serializeBigInt({
    product,
    branch,
    total_stock: total,
  });
};

/* FIFO SALE */

export const processSale = async (
  product_id: number,
  branch_id: number,
  quantity: number,
  reference_id: number
) => {
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      let remaining = quantity;

      const batches = await tx.inventoryBatch.findMany({
        where: {
          product_id,
          branch_id,
          quantity: { gt: 0 },
        },
        orderBy: {
          expiry_date: "asc",
        },
      });

      if (batches.length === 0) {
        throw new Error("No stock available");
      }

      for (const batch of batches) {
        if (remaining <= 0) break;

        const deduct = Math.min(batch.quantity, remaining);

        await tx.inventoryBatch.update({
          where: { batch_id: batch.batch_id },
          data: {
            quantity: { decrement: deduct },
          },
        });

        await tx.stockMovement.create({
          data: {
            branch_id,
            product_id,
            batch_id: batch.batch_id,
            movement_type: "SALE",
            quantity: deduct,
            reference_id,
          },
        });

        remaining -= deduct;
      }

      if (remaining > 0) {
        throw new Error("Insufficient stock");
      }

      return { success: true };
    }
  );

  return serializeBigInt(result);
};

/* REPORTS */

export const lowStock = async () => {
  const result = await prisma.$queryRaw`
    SELECT p.product_id,p.product_name,
    SUM(b.quantity) as total_stock,
    p.reorder_level
    FROM products p
    JOIN inventory_batches b
    ON p.product_id=b.product_id
    GROUP BY p.product_id
    HAVING SUM(b.quantity)<=p.reorder_level
  `;

  return serializeBigInt(result);
};

export const nearExpiry = async () => {
  const result = await prisma.$queryRaw`
    SELECT *
    FROM inventory_batches
    WHERE expiry_date < NOW() + INTERVAL '30 days'
  `;

  return serializeBigInt(result);
};

export const deadStock = async () => {
  const result = await prisma.$queryRaw`
    SELECT *
    FROM products
    WHERE last_sold_date < NOW() - INTERVAL '90 days'
  `;

  return serializeBigInt(result);
};

export const stockValuation = async () => {
  const result = await prisma.$queryRaw`
    SELECT * FROM stock_valuation
  `;

  return serializeBigInt(result);
};