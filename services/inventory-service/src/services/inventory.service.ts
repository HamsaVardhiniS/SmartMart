import prisma from "../config/db";
import { logger } from "../config/logger";

/* PRODUCT MANAGEMENT */

export const createProduct = async(data:any)=>{
 return prisma.product.create({data});
};

export const getProducts = async (page=1,limit=50) => {

 const skip=(page-1)*limit;

 return prisma.product.findMany({
  skip,
  take:limit,
  include:{
   brand:true,
   category:true,
   subcategory:true
  }
 });

};

export const updateProduct = async(id:number,data:any)=>{
 return prisma.product.update({
  where:{product_id:id},
  data
 });
};

export const updateReorderLevel = async(id:number,reorder:number)=>{
 return prisma.product.update({
  where:{product_id:id},
  data:{reorder_level:reorder}
 });
};

export const updateTaxRate = async(id:number,tax:number)=>{
 return prisma.product.update({
  where:{product_id:id},
  data:{tax_percentage:tax}
 });
};

/* BRAND */

export const createBrand = async(data:any)=>{
 return prisma.brand.create({data});
};

export const getBrands = async()=>{
 return prisma.brand.findMany();
};

/* CATEGORY */

export const createCategory = async(data:any)=>{
 return prisma.productCategory.create({data});
};

export const getCategories = async()=>{
 return prisma.productCategory.findMany({
  include:{subcategories:true}
 });
};

/* SUBCATEGORY */

export const createSubcategory = async(data:any)=>{
 return prisma.productSubcategory.create({data});
};

export const getSubcategories = async()=>{
 return prisma.productSubcategory.findMany();
};

/* INVENTORY BATCH */

export const createBatch = async(data:any)=>{

 return prisma.$transaction(async(tx)=>{

  const batch = await tx.inventoryBatch.create({data});

  logger.info("Inventory batch created",{
   product_id:data.product_id,
   branch_id:data.branch_id,
   quantity:data.quantity
  });

  await tx.stockMovement.create({
   data:{
    branch_id:data.branch_id,
    product_id:data.product_id,
    batch_id:batch.batch_id,
    movement_type:"PURCHASE",
    quantity:data.quantity
   }
  });

  return batch;

 });
};

/* MANUAL ADJUSTMENT */

export const adjustStock = async(data:any)=>{
 return prisma.stockMovement.create({
  data:{
   ...data,
   movement_type: data.movement_type || "ADJUSTMENT"
  }
 });
};

/* STOCK */

export const getStock = async(product:number,branch:number)=>{

 const batches = await prisma.inventoryBatch.findMany({
  where:{
   product_id:product,
   branch_id:branch
  }
 });

 const total=batches.reduce((s,b)=>s+b.quantity,0);

 return{
  product,
  branch,
  total_stock:total
 };
};

/* FIFO SALE */

export const processSale = async (
  product_id: number,
  branch_id: number,
  quantity: number,
  reference_id: number,
  batch_id: number
) => {

  return prisma.inventoryBatch.update({
    where: {
      batch_id: batch_id
    },
    data: {
      quantity: {
        decrement: quantity
      }
    }
  });

};

/* REPORTS */

export const lowStock = async()=>{
 return prisma.$queryRaw`
 SELECT p.product_id,p.product_name,
 SUM(b.quantity) as total_stock,
 p.reorder_level
 FROM products p
 JOIN inventory_batches b
 ON p.product_id=b.product_id
 GROUP BY p.product_id
 HAVING SUM(b.quantity)<=p.reorder_level
 `;
};

export const nearExpiry = async()=>{
 return prisma.$queryRaw`
 SELECT *
 FROM inventory_batches
 WHERE expiry_date < NOW() + INTERVAL '30 days'
 `;
};

export const deadStock = async()=>{
 return prisma.$queryRaw`
 SELECT *
 FROM products
 WHERE last_sold_date < NOW() - INTERVAL '90 days'
 `;
};

export const stockValuation = async()=>{
 return prisma.$queryRaw`
 SELECT * FROM stock_valuation
 `;
};