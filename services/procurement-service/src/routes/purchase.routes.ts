import { Router } from "express";
import * as controller from "../controllers/purchase.controller";

const router = Router();

router.post("/orders", controller.createOrder);
router.post("/orders/:orderId/items", controller.addItems);
router.post("/items/:itemId/receive", controller.receiveGoods);
router.patch("/orders/:orderId/cancel", controller.cancelOrder);
router.post("/payments", controller.supplierPayment);

export default router;