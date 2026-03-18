import express from "express";
import * as controller from "../controllers/admin.controller";

const router = express.Router();

/* ROLE */
router.post("/roles",controller.createRole);
router.post("/permissions/assign",controller.assignPermission);

/* USER */
router.post("/users",controller.createUser);

/* CONFIG */
router.post("/config",controller.setConfig);
router.get("/config",controller.getConfig);

/* FEATURE */
router.post("/feature",controller.toggleFeature);

/* APPROVAL */
router.post("/approvals",controller.createApproval);
router.patch("/approvals/:id/approve",controller.approveRequest);

/* AUDIT */
router.get("/logs",controller.getLogs);

/* RESET */
router.post("/reset-password",controller.resetPassword);

/* DEPARTMENT */
router.post("/departments",controller.createDepartment);

export default router;