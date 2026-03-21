import prisma from "../config/db";

/* SALES */
export const updateSalesSummary = async (data: any) => {

  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  return prisma.salesSummaryDaily.upsert({
    where: { summary_date: date },
    update: {
      total_revenue: { increment: data.revenue },
      total_tax: { increment: data.tax },
      total_transactions: { increment: 1 }
    },
    create: {
      summary_date: date,
      total_revenue: data.revenue,
      total_tax: data.tax,
      total_transactions: 1
    }
  });
};

/* PRODUCT */

export const updateProductSales = async(data:any)=>{
 return prisma.productSalesSummary.upsert({
  where:{
   product_id_branch_id:{
    product_id:data.product_id,
    branch_id:data.branch_id
   }
  },
  update:{
   total_quantity:{increment:data.quantity},
   total_revenue:{increment:data.revenue}
  },
  create:{
   product_id:data.product_id,
   branch_id:data.branch_id,
   total_quantity:data.quantity,
   total_revenue:data.revenue
  }
 });
};

/* INVENTORY */

export const updateInventory = async(data:any)=>{
 return prisma.inventorySummary.upsert({
  where:{
   product_id_branch_id:{
    product_id:data.product_id,
    branch_id:data.branch_id
   }
  },
  update:{
   current_stock:data.stock,
   stock_value:data.value
  },
  create:data
 });
};

/* PAYROLL */

export const updatePayroll = async(data:any)=>{
 return prisma.payrollSummary.upsert({
  where:{
   payroll_month_payroll_year:{
    payroll_month:data.month,
    payroll_year:data.year
   }
  },
  update:{
   total_payroll:{increment:data.amount}
  },
  create:{
   payroll_month:data.month,
   payroll_year:data.year,
   total_payroll:data.amount
  }
 });
};

/* SUPPLIER */

export const updateSupplier = async(data:any)=>{
 return prisma.supplierSummary.upsert({
  where:{
   supplier_id_branch_id:{
    supplier_id:data.supplier_id,
    branch_id:data.branch_id
   }
  },
  update:{
   total_purchase_value:{increment:data.amount}
  },
  create:data
 });
};

/* DASHBOARD QUERIES */

export const getRevenue = async()=>{
 return prisma.salesSummaryDaily.findMany({
  orderBy:{summary_date:"desc"},
  take:30
 });
};

export const productRanking = async()=>{
 return prisma.productSalesSummary.findMany({
  orderBy:{total_quantity:"desc"},
  take:10
 });
};

export const inventorySummary = async()=>{
 return prisma.inventorySummary.findMany({
  orderBy:{stock_value:"desc"}
 });
};

export const payrollSummary = async()=>{
 return prisma.payrollSummary.findMany();
};

export const supplierSummary = async()=>{
 return prisma.supplierSummary.findMany();
};