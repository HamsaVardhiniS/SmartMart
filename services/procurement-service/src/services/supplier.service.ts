import prisma from "../config/db";

export const createSupplier = async (data: {
  supplier_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  status?: string;
}) => {
  if (!data.supplier_name) {
    throw new Error("Supplier name is required");
  }

  // 🔹 Normalize inputs (CRITICAL)
  const phone = data.phone?.trim() || undefined;
  const email = data.email?.trim() || undefined;
  const gst = data.gst_number?.trim() || undefined;

  // 🔹 Pre-check uniqueness (better error than Prisma crash)
  if (phone) {
    const exists = await prisma.suppliers.findUnique({
      where: { phone }
    });
    if (exists) throw new Error("Phone already exists");
  }

  if (email) {
    const exists = await prisma.suppliers.findUnique({
      where: { email }
    });
    if (exists) throw new Error("Email already exists");
  }

  if (gst) {
    const exists = await prisma.suppliers.findUnique({
      where: { gst_number: gst }
    });
    if (exists) throw new Error("GST already exists");
  }

  return prisma.suppliers.create({
    data: {
      supplier_name: data.supplier_name,
      contact_person: data.contact_person?.trim() || undefined,
      phone,
      email,
      gst_number: gst,
      status: data.status ?? "Active"
    }
  });
};

/* ---------------- GET ALL ---------------- */
export const getSuppliers = async () => {
  return prisma.suppliers.findMany({
    orderBy: { supplier_id: "desc" }
  });
};

/* ---------------- GET ONE ---------------- */
export const getSupplierById = async (id: number) => {
  if (!id) throw new Error("Invalid supplier ID");

  const supplier = await prisma.suppliers.findUnique({
    where: { supplier_id: id },
    include: {
      supplier_orders: true,
      supplier_payments: true
    }
  });

  if (!supplier) throw new Error("Supplier not found");

  return supplier;
};

/* ---------------- UPDATE ---------------- */
export const updateSupplier = async (
  id: number,
  data: {
    supplier_name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    gst_number?: string;
    status?: string;
  }
) => {
  if (!id) throw new Error("Invalid supplier ID");

  return prisma.suppliers.update({
    where: { supplier_id: id },
    data
  });
};

/* ---------------- DEACTIVATE ---------------- */
export const deactivateSupplier = async (id: number) => {
  if (!id) throw new Error("Invalid supplier ID");

  return prisma.suppliers.update({
    where: { supplier_id: id },
    data: { status: "Inactive" }
  });
};