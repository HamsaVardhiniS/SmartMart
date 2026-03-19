import * as service from "../services/hr.service";

/* EMPLOYEE */
export const createEmployee = async (req, res) =>
  res.json(await service.createEmployee(req.body));

export const getEmployees = async (req, res) =>
  res.json(await service.getEmployees());

export const updateEmployee = async (req, res) =>
  res.json(await service.updateEmployee(+req.params.id, req.body));

export const updateStatus = async (req, res) =>
  res.json(await service.updateEmployeeStatus(+req.params.id, req.body.status));

/* DEPARTMENT */
export const getDepartments = async (req, res) => 
    res.json(await service.getDepartments());

export const createDepartment = async (req, res) =>
  res.json(await service.createDepartment(req.body));

export const assignDepartment = async (req, res) =>
  res.json(await service.assignDepartment(+req.params.id, req.body.department_id));

export const assignManager = async (req, res) =>
  res.json(await service.assignManager(+req.params.id, req.body.manager_id));

/* ATTENDANCE */
export const checkIn = async (req, res) =>
  res.json(await service.checkIn(req.body.employee_id));

export const checkOut = async (req, res) =>
  res.json(await service.checkOut(req.body.employee_id));

export const getAttendance = async (req, res) =>
  res.json(await service.getAttendance(+req.params.id));

/* LEAVE */
export const applyLeave = async (req, res) =>
  res.json(await service.applyLeave(req.body));

export const updateLeaveStatus = async (req, res) =>
  res.json(await service.updateLeaveStatus(+req.params.id, req.body.status));

export const getLeaveBalance = async (req, res) =>
  res.json(await service.getLeaveBalance(+req.params.id));

export const getLeaves = async (req, res) =>
  res.json(await service.getLeaves(+req.params.id));

/* PAYROLL */
export const generatePayroll = async (req, res) =>
  res.json(await service.generatePayroll(req.body));

export const getPayrollHistory = async (req, res) =>
  res.json(await service.getPayrollHistory(+req.params.id));

export const generatePayslip = async (req, res) =>
  res.json(await service.generatePayslip(+req.params.id));