import { Request, Response, NextFunction } from "express";
import * as service from "../services/admin.service";

/* AUTH */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const result = await service.login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const result = await service.getSessionProfile(user.user_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* ROLE */
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createRole(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const assignPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role_id, permission_id } = req.body;
    const result = await service.assignPermission(role_id, permission_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* USER */
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* CONFIG */
export const setConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.setConfig(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getConfig();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* FEATURE */
export const toggleFeature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.toggleFeature(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* APPROVAL */
export const createApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.createApproval(req.body);

    res.json({
      ...result,
      request_id: result.request_id.toString()
    });

  } catch (err) {
    next(err);
  }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const approver = req.body.approved_by;
    const result = await service.approveRequest(id, approver);
    res.json({
      ...result,
      request_id: result.request_id.toString()
    });  
  } catch (err) {
    next(err);
  }
};

/* AUDIT */
export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getLogs();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/* RESET */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.resetEmployeePassword(req.body.employee_id);
    res.json({ message: "reset sent" });
  } catch (err) {
    next(err);
  }
};

/* DEPARTMENT */
export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.createDepartment(req.body);
    res.json({ message: "event sent" });
  } catch (err) {
    next(err);
  }
};
