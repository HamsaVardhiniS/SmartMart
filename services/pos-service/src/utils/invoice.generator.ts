import { serializeBigInt } from "./bigintSerializer";

export const generateInvoice = (transaction: any, items: any[]) => {
  const safeTransaction = serializeBigInt(transaction);
  const safeItems = serializeBigInt(items);

  return {
    invoice_number: safeTransaction.invoice_number,
    transaction_date: safeTransaction.transaction_date,
    total_amount: safeTransaction.total_amount,
    tax_amount: safeTransaction.tax_amount,
    net_amount: safeTransaction.net_amount,
    items: safeItems
  };
};