import { Request, Response, NextFunction } from "express";
import * as service from "../services/hr.service";

/* EMPLOYEE */
export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createEmployee(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getEmployees();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.updateEmployee(+req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.updateEmployeeStatus(+req.params.id, req.body.status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* DEPARTMENT */
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getDepartments();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createDepartment(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const assignDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.assignDepartment(+req.params.id, req.body.department_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const assignManager = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.assignManager(+req.params.id, req.body.manager_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ATTENDANCE */
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.checkIn(req.body.employee_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.checkOut(req.body.employee_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getAttendance(+req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* LEAVE */
export const applyLeave = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.applyLeave(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateLeaveStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.updateLeaveStatus(+req.params.id, req.body.status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLeaveBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getLeaveBalance(+req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLeaves = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getLeaves(+req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* PAYROLL */
export const generatePayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.generatePayroll(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getPayrollHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getPayrollHistory(+req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const generatePayslip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.generatePayslip(+req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};