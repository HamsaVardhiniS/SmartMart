import express from "express";
import * as controller from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticate);

router.get("/revenue", controller.revenue);
router.get("/products", controller.productRanking);
router.get("/inventory", controller.inventorySummary);
router.get("/payroll", controller.payrollSummary);
router.get("/suppliers", controller.supplierSummary);

export default router;