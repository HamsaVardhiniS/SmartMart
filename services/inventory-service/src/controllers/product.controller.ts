import {Request,Response} from "express";
import * as service from "../services/inventory.service";
import { productSchema } from "../utils/validation";

export const createProduct = async (req:Request,res:Response)=>{
 try{
  const parsed = productSchema.parse(req.body);
  const data = await service.createProduct(parsed);
  res.json(data);
 }catch(err){
  res.status(400).json({
   error:(err as Error).message
  });
 }
};

export const getProducts = async(req:Request,res:Response)=>{
 const page = Number(req.query.page) || 1;
 const limit = Number(req.query.limit) || 50;
 const data = await service.getProducts(page,limit);
 res.json(data);
};

export const updateProduct=async(req:Request,res:Response)=>{
 const id=Number(req.params.id);
 const data=await service.updateProduct(id,req.body);
 res.json(data);
};

export const productStock = async(req:Request,res:Response)=>{
 const product = Number(req.params.id);
 const branch = Number(req.query.branch);

 const data = await service.getStock(product,branch);

 res.json(data);
};

export const createBrand=async(req:Request,res:Response)=>{
 const data=await service.createBrand(req.body);
 res.json(data);
};

export const getBrands=async(req:Request,res:Response)=>{
 const data=await service.getBrands();
 res.json(data);
};

export const createCategory=async(req:Request,res:Response)=>{
 const data=await service.createCategory(req.body);
 res.json(data);
};

export const getCategories=async(req:Request,res:Response)=>{
 const data=await service.getCategories();
 res.json(data);
};

export const createSubcategory=async(req:Request,res:Response)=>{
 const data=await service.createSubcategory(req.body);
 res.json(data);
};

export const getSubcategories=async(req:Request,res:Response)=>{
 const data=await service.getSubcategories();
 res.json(data);
};

export const createBatch=async(req:Request,res:Response)=>{
 const data=await service.createBatch(req.body);
 res.json(data);
};

export const processSale=async(req:Request,res:Response)=>{
 const {product_id,branch_id,quantity,reference_id}=req.body;

 const data=await service.processSale(
 product_id,
 branch_id,
 quantity,
 reference_id
 );
 res.json(data);
};

export const stock=async(req:Request,res:Response)=>{
 const p=Number(req.params.product);
 const b=Number(req.params.branch);
 const data=await service.getStock(p,b);
 res.json(data);
};

export const lowStock=async(req:Request,res:Response)=>{
 const data=await service.lowStock();
 res.json(data);
};

export const nearExpiry=async(req:Request,res:Response)=>{
 const data=await service.nearExpiry();
 res.json(data);
};

export const deadStock=async(req:Request,res:Response)=>{
 const data=await service.deadStock();
 res.json(data);
};

export const stockValuation=async(req:Request,res:Response)=>{
 const data=await service.stockValuation();
 res.json(data);
};

export const updateReorder=async(req:Request,res:Response)=>{
 try{
  const id=Number(req.params.id);
  const reorder=req.body.reorder_level;
  const data=await service.updateReorderLevel(id,reorder);
  res.json(data);
 }catch(err){
  res.status(500).json({error:(err as Error).message});
 }
};

export const updateTax=async(req:Request,res:Response)=>{
 try{
  const id=Number(req.params.id);
  const tax=req.body.tax_percentage;
  const data=await service.updateTaxRate(id,tax);
  res.json(data);
 }catch(err){
  res.status(500).json({error:(err as Error).message});
 }
};

export const adjustStock = async(req:Request,res:Response)=>{
 try{
  const data = await service.adjustStock(req.body);
  res.json(data);
 }catch(err){
  res.status(500).json({
   error:(err as Error).message
  });
 }
};