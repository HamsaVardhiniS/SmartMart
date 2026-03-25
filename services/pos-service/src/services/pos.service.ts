import prisma from "../config/db";
import { publishSaleCreated, publishRefund } from "../events/redis.publisher";
import { calculateTax } from "../utils/tax.calculator";
import { generateInvoice } from "../utils/invoice.generator";
import { uploadInvoice } from "../utils/s3.uploader";

/* CREATE SALE */

export const createSale = async (data: any) => {
  if (!data.items || data.items.length === 0) {
    throw new Error("Sale must contain at least one item");
  }

  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    let totalTax = 0;

    const items: any[] = [];

    for (const item of data.items) {
      const tax = calculateTax(item.price, item.tax_percentage || 0);

      totalTax += tax * item.quantity;
      totalAmount += item.price * item.quantity - (item.discount || 0);

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
        branch_id: Number(data.branch_id),
        customer_id: data.customer_id ? Number(data.customer_id) : null,
        total_amount: totalAmount,
        other_discount: data.other_discount || 0,
        tax_amount: totalTax,
        processed_by: Number(data.processed_by)
      } as any
    });

    for (const item of items) {
      await tx.sales_items.create({
        data: {
          transaction_id: sale.transaction_id,
          ...item
        }
      });
    }

    if (data.payments?.length) {
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

      if (Math.abs(paymentTotal - Number(sale.net_amount)) > 0.01) {
        throw new Error("Payment total mismatch");
      }

      await tx.sales_transactions.update({
        where: { transaction_id: sale.transaction_id },
        data: { payment_verified: true }
      });
    }

    await publishSaleCreated({
      transactionId: sale.transaction_id,
      branchId: sale.branch_id,
      customerId: sale.customer_id,
      totalAmount: sale.total_amount,
      taxAmount: sale.tax_amount,
      netAmount: sale.net_amount,
      items: data.items.map((i:any)=>({
        productId: i.product_id,
        batchId: i.batch_id,
        quantity: i.quantity,
        price: i.price
      }))
    });

    const invoice = generateInvoice(sale, items);

    if (process.env.AWS_REGION && process.env.S3_BUCKET) {
      const fileUrl = await uploadInvoice(invoice, Number(sale.transaction_id));

      await tx.invoice_documents.create({
        data: {
          transaction_id: sale.transaction_id,
          file_url: fileUrl
        }
      });
    }

    return { sale, invoice };
  });
};

/* GET SALE */

export const getSale = async (id: number) => {
  const sale = await prisma.sales_transactions.findUnique({
    where: { transaction_id: id },
    include: {
      sales_items: true,
      payments: true,
      documents: true
    }
  });

  if (!sale) throw new Error("Sale not found");

  return sale;
};

/* CANCEL SALE */

export const cancelSale = async (id: number) => {
  const existingSale = await prisma.sales_transactions.findUnique({
    where: { transaction_id: id }
  });

  if (!existingSale) throw new Error("Sale not found");

  if (existingSale.transaction_status !== "COMPLETED") {
    throw new Error("Only completed sales can be cancelled");
  }

  const sale = await prisma.sales_transactions.update({
    where: { transaction_id: id },
    data: { transaction_status: "CANCELLED" }
  });

  await publishRefund({
    transactionId: id,
    reason: "SALE_CANCELLED"
  });

  return sale;
};

/* ADD PAYMENT */

export const addPayment = async (data: any) => {
  const sale = await prisma.sales_transactions.findUnique({
    where: { transaction_id: data.transaction_id }
  });

  if (!sale) throw new Error("Sale not found");

  if (sale.transaction_status !== "COMPLETED") {
    throw new Error("Payment not allowed");
  }

  const payment = await prisma.payments.create({
    data: {
      transaction_id: data.transaction_id,
      payment_method: data.method,
      amount: data.amount,
      payment_reference: data.reference
    }
  });

  const payments = await prisma.payments.aggregate({
    where: { transaction_id: data.transaction_id },
    _sum: { amount: true }
  });

  if (
    Math.abs(Number(payments._sum.amount) - Number(sale.net_amount)) <= 0.01
  ) {
    await prisma.sales_transactions.update({
      where: { transaction_id: data.transaction_id },
      data: { payment_verified: true }
    });
  }

  return payment;
};

/* REFUND */

export const processRefund = async (data: any) => {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund_transactions.create({
      data: {
        original_transaction_id: data.transaction_id,
        refund_reason: data.reason,
        refund_status: data.status
      }
    });

    for (const item of data.items) {
      await tx.refund_items.create({
        data: {
          refund_id: refund.refund_id,
          product_id: item.product_id,
          batch_id: item.batch_id,
          quantity_returned: item.quantity,
          refund_amount: item.amount
        }
      });
    }

    await publishRefund({
      transactionId: data.transaction_id,
      items: data.items
    });

    return refund;
  });
};

/* CUSTOMERS */

export const createCustomer = async (data: any) => {
  try {
    return await prisma.customers.create({ data });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Customer already exists");
    }
    throw error;
  }
};

export const getCustomer = async (id: number) => {
  const customer = await prisma.customers.findUnique({
    where: { customer_id: id }
  });

  if (!customer) throw new Error("Customer not found");

  return customer;
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

/* DAILY REVENUE */

export const dailyRevenue = async () => {
  return prisma.sales_transactions.aggregate({
    where: {
      transaction_status: "COMPLETED"
    },
    _sum: {
      net_amount: true
    }
  });
};

/* PAYMENT METHOD BREAKDOWN */

export const paymentBreakdown = async () => {
  return prisma.payments.groupBy({
    by: ["payment_method"],
    _sum: {
      amount: true
    }
  });
};

/* TOP SELLING PRODUCTS */

export const topProducts = async () => {
  return prisma.sales_items.groupBy({
    by: ["product_id"],
    _sum: {
      quantity_sold: true
    },
    orderBy: {
      _sum: {
        quantity_sold: "desc"
      }
    },
    take: 10
  });
};