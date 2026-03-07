import express from "express";
import * as controller from "../controllers/product.controller";

const router = express.Router();

router.post("/products", controller.createProduct);
router.get("/products", controller.getProducts);
router.patch("/products/:id", controller.updateProduct);

router.patch("/products/:id/reorder", controller.updateReorder);
router.patch("/products/:id/tax", controller.updateTax);
router.get("/products/:id/stock",controller.productStock);

router.post("/brands", controller.createBrand);
router.get("/brands", controller.getBrands);

router.post("/categories", controller.createCategory);
router.get("/categories", controller.getCategories);

router.post("/subcategories", controller.createSubcategory);
router.get("/subcategories", controller.getSubcategories);

router.post("/batches", controller.createBatch);

router.post("/adjust", controller.adjustStock);

router.post("/sales", controller.processSale);

router.get("/stock/:product/:branch", controller.stock);

router.get("/reports/low-stock", controller.lowStock);
router.get("/reports/expiry", controller.nearExpiry);
router.get("/reports/dead-stock", controller.deadStock);
router.get("/reports/valuation", controller.stockValuation);

export default router;