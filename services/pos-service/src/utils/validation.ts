export const validateSaleRequest = (data: any) => {
  if (!data.branch_id) {
    throw new Error("branch_id required");
  }

  if (!data.processed_by) {
    throw new Error("processed_by required");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("Sale items required");
  }
};

export const validateCustomer = (data: any) => {
  if (!data.phone) {
    throw new Error("Customer phone required");
  }
};