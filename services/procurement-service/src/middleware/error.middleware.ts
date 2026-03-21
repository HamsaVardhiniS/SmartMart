import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { ZodError } from "zod";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    err instanceof Error ? err.message : "Unknown error"
  );

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (err instanceof Error) {
    return res.status(500).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
  });
};