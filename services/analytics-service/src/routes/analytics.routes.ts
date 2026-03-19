import express from "express";
import * as controller from "../controllers/analytics.controller";

const router = express.Router();

router.get("/revenue",controller.revenue);
router.get("/products",controller.productRanking);
router.get("/inventory",controller.inventorySummary);
router.get("/payroll",controller.payrollSummary);
router.get("/suppliers",controller.supplierSummary);

export default router;