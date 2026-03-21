import prisma from "../config/db";
import { publishStockReceived } from "../events/inventory.publisher";
import { Prisma } from "@prisma/client";

/* ---------------- CREATE ORDER ---------------- */
export const createPurchaseOrder = async (data: {
  branch_id: number;
  supplier_id?: number;
  expected_delivery_date?: string;
  invoice_number?: string;
}) => {
  if (!data.branch_id) {
    throw new Error("branch_id is required");
  }

  if (data.supplier_id) {
    const supplier = await prisma.suppliers.findUnique({
      where: { supplier_id: data.supplier_id }
    });
    if (!supplier) throw new Error("Invalid supplier_id");
  }

  if (data.invoice_number) {
    const existing = await prisma.supplier_orders.findUnique({
      where: { invoice_number: data.invoice_number }
    });
    if (existing) {
      throw new Error("Invoice number already exists");
    }
  }

  return prisma.supplier_orders.create({
    data: {
      branch_id: data.branch_id,
      supplier_id: data.supplier_id,
      expected_delivery_date: data.expected_delivery_date
        ? new Date(data.expected_delivery_date)
        : undefined,
      invoice_number: data.invoice_number
    }
  });
};

/* ---------------- ADD ITEMS ---------------- */
export const addOrderItems = async (
  orderId: bigint,
  data: {
    items: {
      product_id: number;
      quantity_supplied: number;
      unit_cost: number;
      expiry_date?: string;
    }[];
  }
) => {
  if (!data.items || data.items.length === 0) {
    throw new Error("Items array cannot be empty");
  }

  return prisma.$transaction(async (tx) => {
    let orderTotalIncrement = new Prisma.Decimal(0);

    const createdItems = [];

    for (const item of data.items) {
      if (
        !item.product_id ||
        item.quantity_supplied <= 0 ||
        item.unit_cost <= 0
      ) {
        throw new Error("Invalid item data");
      }

      const totalCost = new Prisma.Decimal(item.unit_cost)
        .mul(item.quantity_supplied);

      orderTotalIncrement = orderTotalIncrement.add(totalCost);

      const created = await tx.supplier_order_items.create({
        data: {
          order_id: orderId,
          product_id: item.product_id,
          quantity_supplied: item.quantity_supplied,
          unit_cost: new Prisma.Decimal(item.unit_cost),
          total_cost: totalCost,
          expiry_date: item.expiry_date
            ? new Date(item.expiry_date)
            : undefined
        }
      });

      createdItems.push(created);
    }

    /* Update order total */
    await tx.supplier_orders.update({
      where: { order_id: orderId },
      data: {
        total_cost: {
          increment: orderTotalIncrement
        }
      }
    });

    return createdItems;
  });
};

/* ---------------- RECEIVE GOODS ---------------- */
export const receiveGoods = async (
  orderItemId: bigint,
  data: { quantity: number }
) => {
  if (!data.quantity || data.quantity <= 0) {
    throw new Error("Invalid quantity");
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.supplier_order_items.findUnique({
      where: { order_item_id: orderItemId }
    });

    if (!item) throw new Error("Order item not found");

    const newReceived = item.quantity_received + data.quantity;

    if (newReceived > item.quantity_supplied) {
      throw new Error("Receiving more than supplied");
    }

    const updatedItem = await tx.supplier_order_items.update({
      where: { order_item_id: orderItemId },
      data: {
        quantity_received: newReceived
      }
    });

    /* -------- ORDER STATUS UPDATE -------- */
    const allItems = await tx.supplier_order_items.findMany({
      where: { order_id: item.order_id }
    });

    const allReceived = allItems.every(
      (i) => i.quantity_received === i.quantity_supplied
    );

    const anyReceived = allItems.some(
      (i) => i.quantity_received > 0
    );

    let status: "Pending" | "Partially_Received" | "Completed" = "Pending";

    if (allReceived) status = "Completed";
    else if (anyReceived) status = "Partially_Received";

    await tx.supplier_orders.update({
      where: { order_id: item.order_id },
      data: { status }
    });

    /* EVENT → Inventory */
    await publishStockReceived(updatedItem);

    return updatedItem;
  });
};

/* ---------------- CANCEL ORDER ---------------- */
export const cancelOrder = async (orderId: bigint) => {
  const order = await prisma.supplier_orders.findUnique({
    where: { order_id: orderId }
  });

  if (!order) throw new Error("Order not found");

  if (order.status === "Cancelled") {
    throw new Error("Order already cancelled");
  }

  if (order.status === "Completed") {
    throw new Error("Cannot cancel completed order");
  }

  return prisma.supplier_orders.update({
    where: { order_id: orderId },
    data: { status: "Cancelled" }
  });
};

/* ---------------- SUPPLIER PAYMENT ---------------- */
export const recordSupplierPayment = async (data: {
  supplier_id?: number;
  order_id?: string;
  amount: number;
  payment_status?: "PENDING" | "PARTIAL" | "COMPLETED";
}) => {
  if (!data.amount || data.amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  if (data.supplier_id) {
    const supplier = await prisma.suppliers.findUnique({
      where: { supplier_id: data.supplier_id }
    });
    if (!supplier) throw new Error("Invalid supplier_id");
  }

  return prisma.supplier_payments.create({
    data: {
      supplier_id: data.supplier_id,
      order_id: data.order_id ? BigInt(data.order_id) : undefined,
      amount: new Prisma.Decimal(data.amount),
      payment_status: data.payment_status ?? "PENDING"
    }
  });
};