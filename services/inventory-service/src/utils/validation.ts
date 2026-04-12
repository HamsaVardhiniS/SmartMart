import { z } from "zod";

export const productSchema = z.object({
 sku: z.string().optional(),
 barcode: z.string().optional(),
 product_name: z.string(),
 brand_id: z.number().optional(),
 category_id: z.number().optional(),
 subcategory_id: z.number().optional(),
 unit: z.string().optional(),
 reorder_level: z.number().optional(),
 tax_percentage: z.number().optional()
});