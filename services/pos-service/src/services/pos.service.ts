import prisma from "../config/db";
import { publishSaleEvent, publishRefundEvent } from "../events/redis.producer";
import { calculateTax } from "../utils/tax.calculator";
import { generateInvoice } from "../utils/invoice.generator";

/* CREATE SALE */

export const createSale = async (data: any) => {

  return prisma.$transaction(async (tx) => {

    let totalAmount = 0;
    let totalTax = 0;

    const items = [];

    for (const item of data.items) {

      const tax = calculateTax(item.price, item.tax_percentage || 0);

      totalTax += tax * item.quantity;

      totalAmount += (item.price * item.quantity) - (item.discount || 0);

      items.push({
        product_id: item.product_id,
        batch_id: item.batch_id,
        quantity_sold: item.quantity,
        selling_price: item.price,
        discount: item.discount || 0
      });

    }

    const sale = await tx.sales_transactions.create({
      data: {
        branch_id: data.branch_id,
        customer_id: data.customer_id || null,
        total_amount: totalAmount,
        other_discount: data.other_discount || 0,
        tax_amount: totalTax,
        processed_by: data.processed_by
      }
    });

    for (const item of items) {

      await tx.sales_items.create({
        data: {
          transaction_id: sale.transaction_id,
          ...item
        }
      });

    }

    if (data.payments && data.payments.length > 0) {

      let paymentTotal = 0;

      for (const payment of data.payments) {

        paymentTotal += payment.amount;

        await tx.payments.create({
          data: {
            transaction_id: sale.transaction_id,
            payment_method: payment.method,
            amount: payment.amount,
            payment_reference: payment.reference
          }
        });

      }

      if (paymentTotal !== sale.net_amount) {
        throw new Error("Payment total does not match invoice amount");
      }

      await tx.sales_transactions.update({
        where: { transaction_id: sale.transaction_id },
        data: { payment_verified: true }
      });

    }

    await publishSaleEvent({
      transaction_id: sale.transaction_id,
      items: data.items
    });

    const invoice = generateInvoice(sale, items);

    return { sale, invoice };

  });

};


/* GET SALE */

export const getSale = async (id: number) => {

  return prisma.sales_transactions.findUnique({
    where: { transaction_id: id },
    include: {
      sales_items: true,
      payments: true,
      documents: true
    }
  });

};


/* CANCEL SALE */

export const cancelSale = async (id: number) => {

  const sale = await prisma.sales_transactions.update({
    where: { transaction_id: id },
    data: { transaction_status: "CANCELLED" }
  });

  await publishRefundEvent({
    transaction_id: id,
    reason: "SALE_CANCELLED"
  });

  return sale;

};


/* REFUND */

export const processRefund = async (data: any) => {

  const refund = await prisma.refund_transactions.create({
    data: {
      original_transaction_id: data.transaction_id,
      refund_reason: data.reason,
      refund_status: data.status
    }
  });

  for (const item of data.items) {

    await prisma.refund_items.create({
      data: {
        refund_id: refund.refund_id,
        product_id: item.product_id,
        batch_id: item.batch_id,
        quantity_returned: item.quantity,
        refund_amount: item.amount
      }
    });

  }

  await publishRefundEvent({
    transaction_id: data.transaction_id,
    items: data.items
  });

  return refund;

};


/* CUSTOMERS */

export const createCustomer = async (data: any) => {
  return prisma.customers.create({ data });
};

export const getCustomer = async (id: number) => {
  return prisma.customers.findUnique({
    where: { customer_id: id }
  });
};

export const updateCustomer = async (id: number, data: any) => {
  return prisma.customers.update({
    where: { customer_id: id },
    data
  });
};


/* CUSTOMER HISTORY */

export const customerHistory = async (id: number) => {

  return prisma.sales_transactions.findMany({
    where: { customer_id: id },
    include: {
      sales_items: true
    },
    orderBy: {
      transaction_date: "desc"
    }
  });

};


/* CUSTOMER LIFETIME SUMMARY */

export const customerLifetimeSummary = async (id: number) => {

  return prisma.customer_lifetime_summary.findMany({
    where: {
      customer_id: id
    }
  });

};


/* CUSTOMER FEEDBACK */

export const addFeedback = async (data: any) => {

  return prisma.customer_feedback.create({
    data
  });

};