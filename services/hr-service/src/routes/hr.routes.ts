import express from "express";
import * as controller from "../controllers/hr.controller";

const router = express.Router();

/* EMPLOYEE */
router.post("/employees", controller.createEmployee);
router.get("/employees", controller.getEmployees);
router.put("/employees/:id", controller.updateEmployee);
router.patch("/employees/:id/status", controller.updateStatus);

/* DEPARTMENT */
router.get("/departments", controller.getDepartments);
router.post("/departments", controller.createDepartment);
router.patch("/employees/:id/department", controller.assignDepartment);
router.patch("/departments/:id/manager", controller.assignManager);

/* ATTENDANCE */
router.post("/attendance/check-in", controller.checkIn);
router.post("/attendance/check-out", controller.checkOut);
router.get("/attendance/:id", controller.getAttendance);

/* LEAVE */
router.post("/leave", controller.applyLeave);
router.patch("/leave/:id", controller.updateLeaveStatus);
router.get("/leave/:id", controller.getLeaves);
router.get("/leave-balance/:id", controller.getLeaveBalance);

/* PAYROLL */
router.post("/payroll", controller.generatePayroll);
router.get("/payroll/:id", controller.getPayrollHistory);
router.get("/payslip/:id", controller.generatePayslip);

export default router;