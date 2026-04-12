import prisma from "../config/db";
import redis from "../config/redis";
import { logger } from "../config/logger";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* AUTH */
export const login = async (username: string, password: string) => {
  const user = await prisma.adminUser.findUnique({
    where: { username },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user || !user.is_active) {
    throw new Error("Invalid credentials or inactive account");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const permissions = user.role?.permissions.map(p => p.permission.permission_name) ?? [];

  const token = jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role_name: user.role?.role_name ?? null,
      permissions
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );

  return {
    token,
    user_id: user.user_id,
    username: user.username,
    role_id: user.role_id,
    role_name: user.role?.role_name ?? null,
    permissions
  };
};

export const getSessionProfile = async (user_id: number | bigint) => {
  const user = await prisma.adminUser.findUnique({
    where: { user_id: Number(user_id) },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  if (!user || !user.is_active) {
    throw new Error("User not found or inactive");
  }

  return {
    user_id: user.user_id,
    username: user.username,
    role_id: user.role_id,
    role_name: user.role?.role_name ?? null,
    permissions: user.role?.permissions.map(p => p.permission.permission_name) ?? []
  };
};

/* ROLE */
export const createRole = async (data: any) => {
  return prisma.role.create({ data });
};

export const assignPermission = async (role: number, permission: number) => {
  const res = await prisma.rolePermission.upsert({
    where: {
      role_id_permission_id: {
        role_id: role,
        permission_id: permission
      }
    },
    update: {},
    create: {
      role_id: role,
      permission_id: permission
    }
  });

  await redis.publish("admin.role.updated", JSON.stringify({
    eventId: randomUUID(),
    eventType: "admin.role.updated.v1",
    timestamp: new Date().toISOString(),
    source: "admin-service",
    data: { role }
  }));

  return res;
};

/* USER */
export const createUser = async (data: any) => {
  if (!data.password && !data.password_hash) {
    throw new Error("Password is required");
  }
  const password_hash = data.password_hash ?? await bcrypt.hash(data.password, 10);
  const { password, ...rest } = data;
  return prisma.adminUser.create({
    data: {
      ...rest,
      password_hash,
      role_id: data.role_id ? parseInt(data.role_id) : undefined
    }
  });
};

/* CONFIG */
export const setConfig = async (data: any) => {
  const res = await prisma.systemConfig.upsert({
    where: { config_key: data.config_key },
    update: { config_value: data.config_value },
    create: data
  });

  await redis.publish("admin.config.updated", JSON.stringify({
    eventId: randomUUID(),
    eventType: "admin.config.updated.v1",
    timestamp: new Date().toISOString(),
    source: "admin-service",
    data
  }));
  return res;
};

export const getConfig = async () => {
  return prisma.systemConfig.findMany();
};

/* FEATURE */
export const toggleFeature = async (data: any) => {
  const res = await prisma.featureFlag.upsert({
    where: { feature_name: data.feature_name },
    update: { is_enabled: data.is_enabled },
    create: data
  });

  await redis.publish("admin.feature.updated", JSON.stringify({
    eventId: randomUUID(),
    eventType: "admin.feature.updated.v1",
    timestamp: new Date().toISOString(),
    source: "admin-service",
    data
  }));
  return res;
};

/* APPROVAL */
export const createApproval = async (data: any) => {
  return prisma.approvalRequest.create({
    data: {
      ...data,
      request_data: data.request_data ?? {}
    }
  });
};

export const approveRequest = async (id: bigint, approved_by: number) => {
  return prisma.approvalRequest.update({
    where: { request_id: id },
    data: { status: "APPROVED", approved_by }
  });
};

/* AUDIT */
export const logAction = async (data: any) => {
  return prisma.auditLog.create({
    data: {
      ...data,
      metadata: data.metadata ?? {}
    }
  });
};

export const getLogs = async () => {
  return prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100
  });
};

/* RESET */
export const resetEmployeePassword = async (employee_id: number) => {
  await redis.publish("hr.employee.reset_password", JSON.stringify({
    eventId: randomUUID(),
    eventType: "hr.employee.reset_password.v1",
    timestamp: new Date().toISOString(),
    source: "admin-service",
    data: { employee_id }
  }));
  logger.info(`Password reset event: ${employee_id}`);
};

/* DEPARTMENT */
export const createDepartment = async (data: any) => {
  await redis.publish("admin.department.created", JSON.stringify({
    eventId: randomUUID(),
    eventType: "admin.department.created.v1",
    timestamp: new Date().toISOString(),
    source: "admin-service",
    data
  }));
  logger.info(`Department create event: ${JSON.stringify(data)}`);
};
