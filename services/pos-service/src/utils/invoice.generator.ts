export const generateInvoice = (transaction: any, items: any[]) => {
  return {
    invoice_number: transaction.invoice_number,
    transaction_date: transaction.transaction_date,
    total_amount: transaction.total_amount,
    tax_amount: transaction.tax_amount,
    net_amount: transaction.net_amount,
    items
  };
};