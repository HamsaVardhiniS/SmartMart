import prisma from "../config/db";
import bcrypt from "bcrypt";

/* ================= EMPLOYEE ================= */
export const createEmployee = async (data: any) => {
  if (!data.password) {
    throw new Error("Password is required");
  }

  const hash = await bcrypt.hash(data.password, 10);

  // ✅ REMOVE password before saving
  const { password, ...rest } = data;

  const emp = await prisma.employees.create({
    data: {
      ...rest,
      password_hash: hash,
    },
  });

  // ✅ Initialize leave balance
  await prisma.leave_balance.create({
    data: {
      employee_id: emp.employee_id,
      total_allowed: rest.allowed_leaves || 12,
      used_leaves: 0,
    },
  });

  return emp;
};

export const getEmployees = async () => {
  return prisma.employees.findMany({
    include: {
      department: true,
    },
  });
};

export const updateEmployee = async (id: number, data: any) => {
  return prisma.employees.update({
    where: { employee_id: id },
    data,
  });
};

export const updateEmployeeStatus = async (id: number, status: any) => {
  return prisma.employees.update({
    where: { employee_id: id },
    data: { status },
  });
};

/* ================= DEPARTMENT ================= */
export const getDepartments = async () => {
  return prisma.departments.findMany({
    include: {
      manager: true,     // optional (gives manager details)
      employees: true    // optional (all employees in dept)
    }
  });
};

export const createDepartment = async (data: any) => {
  return prisma.departments.create({ data });
};

export const assignDepartment = async (empId: number, deptId: number) => {
  return prisma.employees.update({
    where: { employee_id: empId },
    data: { department_id: deptId },
  });
};

export const assignManager = async (deptId: number, managerId: number) => {
  return prisma.departments.update({
    where: { department_id: deptId },
    data: { manager_id: managerId },
  });
};

/* ================= ATTENDANCE ================= */

const getToday = () => new Date(new Date().toISOString().split("T")[0]);

export const checkIn = async (employee_id: number) => {
  return prisma.attendance.create({
    data: {
      employee_id,
      attendance_date: getToday(),
      check_in_time: new Date(),
    },
  });
};

export const checkOut = async (employee_id: number) => {
  const record = await prisma.attendance.findFirst({
    where: {
      employee_id,
      attendance_date: getToday(),
    },
  });

  if (!record) throw new Error("No check-in found");

  const out = new Date();

  const hours =
    (out.getTime() - new Date(record.check_in_time!).getTime()) /
    (1000 * 60 * 60);

  return prisma.attendance.update({
    where: { attendance_id: record.attendance_id },
    data: {
      check_out_time: out,
      total_hours: hours,
      overtime_hours: hours > 8 ? hours - 8 : 0,
    },
  });
};

export const getAttendance = async (employee_id: number) => {
  return prisma.attendance.findMany({
    where: { employee_id },
    orderBy: { attendance_date: "desc" },
  });
};

/* ================= LEAVE ================= */

export const applyLeave = async (data: any) => {
  return prisma.leave_requests.create({ data });
};

export const updateLeaveStatus = async (id: number, status: any) => {
  const leave = await prisma.leave_requests.update({
    where: { leave_id: id },
    data: { status },
  });

  // AUTO leave deduction
  if (status === "Approved") {
    const days =
      (new Date(leave.end_date).getTime() -
        new Date(leave.start_date).getTime()) /
        (1000 * 60 * 60 * 24) +
      1;

    await prisma.leave_balance.update({
      where: { employee_id: leave.employee_id },
      data: {
        used_leaves: { increment: days },
      },
    });
  }

  return leave;
};

export const getLeaveBalance = async (employee_id: number) => {
  return prisma.leave_balance.findUnique({
    where: { employee_id },
  });
};

export const getLeaves = async (employee_id: number) => {
  return prisma.leave_requests.findMany({
    where: { employee_id },
    orderBy: { leave_id: "desc" },
  });
};

/* ================= PAYROLL ================= */

export const generatePayroll = async (data: any) => {
  const emp = await prisma.employees.findUnique({
    where: { employee_id: data.employee_id },
  });

  if (!emp) throw new Error("Employee not found");

  const leaveBal = await prisma.leave_balance.findUnique({
    where: { employee_id: data.employee_id },
  });

  const deduction =
    (Number(emp.salary) / 30) * (leaveBal?.used_leaves || 0);

  return prisma.payroll.create({
    data: {
      employee_id: data.employee_id,
      payroll_month: data.month,
      payroll_year: data.year,
      base_salary: emp.salary,
      leave_deduction: deduction,
      bonus: data.bonus || 0,
    },
  });
};

export const getPayrollHistory = async (employee_id: number) => {
  return prisma.payroll.findMany({
    where: { employee_id },
    orderBy: { payroll_year: "desc" },
  });
};

/* ================= PAYSLIP ================= */

export const generatePayslip = async (payroll_id: number) => {
  const payroll = await prisma.payroll.findUnique({
    where: { payroll_id },
    include: { employee: true },
  });

  if (!payroll) throw new Error("Payroll not found");

  return {
    employee: payroll.employee.first_name,
    month: payroll.payroll_month,
    year: payroll.payroll_year,
    base: payroll.base_salary,
    deduction: payroll.leave_deduction,
    bonus: payroll.bonus,
    net: payroll.net_salary,
  };
};

/* ================= PASSWORD RESET ================= */

export const createResetToken = async (data: any) => {
  return prisma.password_resets.create({ data });
};