import { prisma } from "../config/db";
import { publishStockReceived } from "../events/inventory.events";

export const createPurchaseOrder = async (data: any) => {

  const existing = await prisma.supplier_orders.findUnique({
    where: { invoice_number: data.invoice_number }
  });

  if (existing) {
    throw new Error("Invoice number already exists");
  }

  return prisma.supplier_orders.create({
    data: {
      branch_id: data.branch_id,
      supplier_id: data.supplier_id,
      expected_delivery_date: new Date(data.expected_delivery_date),
      invoice_number: data.invoice_number
    }
  });
};

export const addOrderItems = async (orderId: bigint, items: any[]) => {

  const created = await prisma.$transaction(
    items.map((item) =>
      prisma.supplier_order_items.create({
        data: {
          order_id: orderId,
          product_id: item.product_id,
          quantity_supplied: item.quantity_supplied,
          unit_cost: item.unit_cost,
          expiry_date: item.expiry_date
        }
      })
    )
  );

  return created;
};

export const receiveGoods = async (
  orderItemId: bigint,
  quantity: number
) => {

  const item = await prisma.supplier_order_items.findUnique({
    where: { order_item_id: orderItemId }
  });

  if (!item) throw new Error("Order item not found");

  if (quantity + item.quantity_received > item.quantity_supplied)
    throw new Error("Receiving more than supplied");

  const updated = await prisma.supplier_order_items.update({
    where: { order_item_id: orderItemId },
    data: {
      quantity_received: item.quantity_received + quantity
    }
  });

  await publishStockReceived(updated);

  return updated;
};

export const cancelOrder = async (orderId: bigint) => {
  return prisma.supplier_orders.update({
    where: { order_id: orderId },
    data: { status: "Cancelled" }
  });
};

export const recordSupplierPayment = async (data: any) => {
  return prisma.supplier_payments.create({ data });
};