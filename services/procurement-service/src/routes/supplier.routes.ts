import { Router } from "express";
import * as controller from "../controllers/supplier.controller";

const router = Router();

router.post("/", controller.createSupplier);
router.get("/", controller.getSuppliers);
router.get("/:id", controller.getSupplier);
router.put("/:id", controller.updateSupplier);
router.patch("/:id/deactivate", controller.deactivateSupplier);

export default router;