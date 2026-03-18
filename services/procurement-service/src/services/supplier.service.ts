import { prisma } from "../config/db";

export const createSupplier = async (data: any) => {
  return prisma.suppliers.create({ data });
};

export const getSuppliers = async () => {
  return prisma.suppliers.findMany({
    orderBy: { supplier_id: "desc" }
  });
};

export const getSupplierById = async (id: number) => {
  return prisma.suppliers.findUnique({
    where: { supplier_id: id },
    include: {
      supplier_orders: true,
      supplier_payments: true
    }
  });
};

export const updateSupplier = async (id: number, data: any) => {
  return prisma.suppliers.update({
    where: { supplier_id: id },
    data
  });
};

export const deactivateSupplier = async (id: number) => {
  return prisma.suppliers.update({
    where: { supplier_id: id },
    data: { status: "Inactive" }
  });
};