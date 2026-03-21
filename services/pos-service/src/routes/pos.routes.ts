import { Router } from "express";
import * as controller from "../controllers/pos.controller";

const router = Router();

/* HEALTH CHECK */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: process.env.SERVICE_NAME || "pos-service",
    timestamp: new Date().toISOString()
  });
});

/* SALES */
router.post("/sales", controller.createSale);
router.get("/sales/:id", controller.getSale);
router.patch("/sales/:id/cancel", controller.cancelSale);

/* PAYMENTS */
router.post("/payments", controller.addPayment);

/* REFUNDS */
router.post("/refunds", controller.processRefund);

/* CUSTOMERS */
router.post("/customers", controller.createCustomer);
router.get("/customers/:id", controller.getCustomer);
router.patch("/customers/:id", controller.updateCustomer);

/* HISTORY */
router.get("/customers/:id/history", controller.customerHistory);
router.post("/customers/feedback", controller.addFeedback);
router.get("/customers/:id/summary", controller.customerSummary);

/* ANALYTICS */
router.get("/analytics/daily-revenue", controller.dailyRevenue);
router.get("/analytics/payment-breakdown", controller.paymentBreakdown);
router.get("/analytics/top-products", controller.topProducts);

export default router;